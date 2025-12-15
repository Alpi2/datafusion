import OpenAI from "openai";
import { logger } from "../../shared/utils/logger";
import { AIGenerationRequest, AIGenerationResponse } from "./types";

export class OpenAIService {
  private client: any;
  private disabled: boolean = false;
  constructor() {
    // Allow disabling OpenAI usage via env flag for local development.
    // If DISABLE_OPENAI is 'true' or OPENAI_API_KEY is not set, use a stub implementation.
    if (process.env.DISABLE_OPENAI === "true" || !process.env.OPENAI_API_KEY) {
      this.disabled = true;
      this.client = null;
      logger.warn("OpenAI is disabled (DISABLE_OPENAI=true or OPENAI_API_KEY missing). Using stub responses.");
      return;
    }

    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateDataset(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse> {
    const { prompt, schema, tier, rowCount = 100, knowledgeContext } = request;
    const systemPrompt = this.buildSystemPrompt(tier, schema, knowledgeContext);
    const userPrompt = this.buildUserPrompt(prompt, rowCount, schema);
    logger.info(`🤖 OpenAI generation started: ${tier} tier, ${rowCount} rows`);
    // If disabled, return a deterministic stubbed dataset for development.
    if (this.disabled) {
      logger.info("OpenAIService.generateDataset: returning stub data (disabled mode)");
      const data: any[] = [];
      for (let i = 0; i < rowCount; i++) {
        const row: Record<string, any> = {};
        if (schema && Array.isArray(schema.fields) && schema.fields.length) {
          for (const f of schema.fields) {
            // provide simple placeholder values based on type if available
            const fname = f.name || "col";
            const ftype = (f.type || "string").toLowerCase();
            if (ftype.includes("int") || ftype.includes("number")) row[fname] = i;
            else if (ftype.includes("date")) row[fname] = new Date().toISOString();
            else row[fname] = `${fname}_sample_${i}`;
          }
        } else {
          row["id"] = i + 1;
          row["value"] = `sample_${i + 1}`;
        }
        data.push(row);
      }

      return {
        provider: "stub",
        model: "stub-model",
        data,
        metadata: {},
      };
    }

    const completion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "4096"),
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");
    const text =
      typeof content === "string"
        ? content
        : (content as any).parts?.map((p: any) => p.text).join("") || "";
    const data = this.parseResponse(text);

    return {
      provider: "openai",
      model:
        completion.model || process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      data,
      metadata: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
      },
    };
  }

  private buildSystemPrompt(
    tier: string | undefined,
    schema?: any,
    knowledgeContext?: string
  ): string {
    let prompt =
      "You are a synthetic data generation expert. Generate realistic, diverse, and high-quality data.";
    if (knowledgeContext) {
      prompt += `\n\nContext from uploaded documents:\n${knowledgeContext}`;
    }
    if (tier === "workflow") {
      prompt += " Focus on relationships and schema adherence.";
    } else if (tier === "production") {
      prompt += " Ensure enterprise-grade accuracy and compliance markers.";
    }
    if (schema) {
      prompt += `\n\nSchema: ${JSON.stringify(schema, null, 2)}`;
    }
    prompt +=
      "\n\nReturn ONLY a valid JSON array of objects. No markdown, no explanations.";
    return prompt;
  }

  private buildUserPrompt(
    prompt: string,
    rowCount: number,
    schema?: any
  ): string {
    let userPrompt = `Generate ${rowCount} rows of synthetic data based on: ${prompt}`;
    if (schema?.fields) {
      const fieldNames = schema.fields.map((f: any) => f.name).join(", ");
      userPrompt += `\n\nFields: ${fieldNames}`;
    }
    return userPrompt;
  }

  private parseResponse(content: string): any[] {
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    try {
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      logger.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid JSON response from OpenAI");
    }
  }
}

export default new OpenAIService();
