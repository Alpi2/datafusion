// @ts-ignore - optional dependency, provide runtime if available
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../../shared/utils/logger";
import { AIGenerationRequest, AIGenerationResponse } from "./types";

export class ClaudeService {
  private client: any;
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateDataset(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse> {
    const { prompt, schema, tier, rowCount = 100 } = request;
    logger.info(
      `🤖 Claude generation started: ${
        tier || "default"
      } tier, ${rowCount} rows`
    );

    const systemPrompt = this.buildSystemPrompt(tier || "default", schema);
    const userPrompt = this.buildUserPrompt(prompt, rowCount, schema);

    const message = await this.client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620",
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || "4096"),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || "0.7"),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = Array.isArray(message.content)
      ? message.content[0]
      : message.content;
    if (!content || content.type !== "text") {
      logger.error("Unexpected response from Claude:", message);
      throw new Error("Unexpected response type from Claude");
    }

    const data = this.parseResponse(content.text);

    return {
      provider: "claude",
      model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet",
      data,
      metadata: {
        inputTokens: message.usage?.input_tokens,
        outputTokens: message.usage?.output_tokens,
        raw: message,
      },
    };
  }

  private buildSystemPrompt(tier: string, schema?: any): string {
    let prompt =
      "You are a synthetic data generation expert specializing in structured, analytical data with strong logical consistency.";
    if (tier === "workflow") {
      prompt += " Focus on complex relationships and schema adherence.";
    } else if (tier === "production") {
      prompt +=
        " Generate enterprise-grade data with maximum accuracy and regulatory compliance markers.";
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
      logger.error("Failed to parse Claude response:", error);
      throw new Error("Invalid JSON response from Claude");
    }
  }
}

export default new ClaudeService();
