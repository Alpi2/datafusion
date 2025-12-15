import OpenAI from "openai";
import prisma from "../../config/database";
import { EmbeddingsService } from "../embeddings/embeddings.service";
import { logger } from "../../shared/utils/logger";

export class RAGService {
  private openai: any;
  private embeddings: EmbeddingsService;
  constructor() {
    if (process.env.DISABLE_OPENAI === "true" || !process.env.OPENAI_API_KEY) {
      this.openai = null;
      logger.warn("OpenAI is disabled (DISABLE_OPENAI=true or OPENAI_API_KEY missing). RAG responses will be stubbed.");
    } else {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    this.embeddings = new EmbeddingsService();
  }
  async chatWithDataset(
    userId: string,
    datasetId: string,
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    logger.info(`💬 Chat with dataset ${datasetId}: ${message}`);
    // 1. Get dataset context
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId },
      include: { creator: true },
    });
    if (!dataset) throw new Error("Dataset not found");
    // 2. Get relevant knowledge documents
    const knowledgeContext = await this.embeddings.getKnowledgeContext(
      userId,
      message
    );
    // 3. Build context from dataset preview
    const datasetContext = this.buildDatasetContext(dataset);
    // 4. Generate AI response with RAG
    const systemPrompt = `You are a helpful AI assistant analyzing a synthetic dataset.
Dataset Information:
${datasetContext}
${knowledgeContext ? `User's Knowledge Base:\n${knowledgeContext}\n` : ""}
Your role is to:
- Answer questions about the dataset structure, patterns, and quality
- Detect anomalies and suggest improvements
- Provide statistical insights
- Validate data consistency
- Suggest use cases
Be concise, accurate, and helpful.`;
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];
    if (!this.openai) {
      logger.warn("RAGService: OpenAI disabled, returning stub response.");
      return "OpenAI disabled in this environment. RAG response unavailable.";
    }
    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000"),
    });
    const response =
      completion.choices?.[0]?.message?.content || "No response generated.";
    return response;
  }
  private buildDatasetContext(dataset: any): string {
    const preview = dataset.previewData || [];
    const sampleData = JSON.stringify(preview.slice(0, 3), null, 2);
    return `
Title: ${dataset.title}
Description: ${dataset.description}
Category: ${dataset.category}
Rows: ${dataset.rowCount}
Columns: ${dataset.columnCount}
Quality Score: ${dataset.qualityScore}%
Sample Data (first 3 rows):
${sampleData}
    `.trim();
  }
  async detectPatterns(datasetId: string): Promise<any> {
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId },
    });
    if (!dataset) throw new Error("Dataset not found");
    const prompt = `Analyze this dataset and detect patterns:
${JSON.stringify(dataset.previewData, null, 2)}
Provide:
1. Data distribution patterns
2. Correlations between fields
3. Potential outliers
4. Data quality issues
Format as JSON.`;
    if (!this.openai) {
      logger.warn("RAGService.detectPatterns: OpenAI disabled, returning empty analysis.");
      return { analysis: "OpenAI disabled in this environment." };
    }
    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const response = completion.choices?.[0]?.message?.content || "{}";
    try {
      return JSON.parse(response);
    } catch {
      return { analysis: response };
    }
  }
  async detectAnomalies(datasetId: string): Promise<any> {
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId },
    });
    if (!dataset) throw new Error("Dataset not found");
    const prompt = `Detect anomalies in this dataset:
${JSON.stringify(dataset.previewData, null, 2)}
Identify:
1. Outliers in numerical fields
2. Inconsistent data formats
3. Missing or null values
4. Suspicious patterns
Format as JSON with severity levels.`;
    if (!this.openai) {
      logger.warn("RAGService.detectAnomalies: OpenAI disabled, returning empty anomalies.");
      return { anomalies: "OpenAI disabled in this environment." };
    }
    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const response = completion.choices?.[0]?.message?.content || "{}";
    try {
      return JSON.parse(response);
    } catch {
      return { anomalies: response };
    }
  }
}

export default new RAGService();
