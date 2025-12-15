// @ts-ignore - optional dependency
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../../shared/utils/logger";
import { AIGenerationRequest, AIGenerationResponse } from "./types";

export class GeminiService {
  private client: any;
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
  }

  async generateDataset(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse> {
    const { prompt, schema, tier, rowCount = 100 } = request;
    logger.info(
      `🤖 Gemini generation started: ${
        tier || "default"
      } tier, ${rowCount} rows`
    );

    const model = this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-pro",
    });
    const systemPrompt = this.buildSystemPrompt(tier || "default", schema);
    const userPrompt = this.buildUserPrompt(prompt, rowCount, schema);

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      generationConfig: {
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "4096"),
      },
    });

    const response = result.response;
    const text =
      typeof response?.text === "function"
        ? response.text()
        : response?.text || "";
    const data = this.parseResponse(text);

    return {
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-pro",
      data,
      metadata: {
        inputTokens: 0,
        outputTokens: 0,
        raw: result,
      },
    };
  }

  private buildSystemPrompt(tier: string, schema?: any): string {
    let prompt =
      "You are a synthetic data generation expert specializing in numerical data, time series, and scientific datasets with strong mathematical accuracy.";
    if (tier === "workflow") {
      prompt += " Focus on statistical patterns and numerical relationships.";
    } else if (tier === "production") {
      prompt +=
        " Generate enterprise-grade data with maximum mathematical precision.";
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
      logger.error("Failed to parse Gemini response:", error);
      throw new Error("Invalid JSON response from Gemini");
    }
  }
}

export default new GeminiService();
