import OpenAI from "openai";
import { logger } from "../../../shared/utils/logger";

export interface GenerationRequest {
  prompt: string;
  schema?: any;
  tier: "basic" | "workflow" | "production";
  rowCount?: number;
}

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (process.env.DISABLE_OPENAI === "true" || !process.env.OPENAI_API_KEY) {
      // Client is unavailable in disabled mode; methods should fallback to synthetic behavior.
      // Keep the property defined but null to allow existing checks like `if (!this.client)`.
      // @ts-ignore
      this.client = null;
      logger.warn("Generation OpenAI client disabled (DISABLE_OPENAI=true or OPENAI_API_KEY missing). Using synthetic fallbacks.");
    } else {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Fast preview generation path: returns a small number of rows quickly.
   * If OpenAI is configured and a lightweight model is available it could call it,
   * otherwise returns a synthetic preview based on schema or prompt.
   */
  async generatePreview(request: GenerationRequest): Promise<any[]> {
    const { prompt, schema, tier, rowCount = 5 } = request;
    // If OpenAI client is unavailable or preview model not set, generate synthetic rows
    if (!this.client || !process.env.OPENAI_PREVIEW_MODEL) {
      const rows: any[] = [];
      for (let i = 0; i < Math.min(10, rowCount); i++) {
        const r: any = { previewIndex: i + 1 };
        if (schema && Array.isArray(schema.fields)) {
          for (const f of schema.fields) {
            const name =
              f.name ||
              f.field ||
              `col_${Math.random().toString(36).slice(2, 6)}`;
            r[name] = `${name}_sample_${i + 1}`;
          }
        } else {
          r[`sample_${i + 1}`] = `${prompt?.slice(0, 30) || "data"}_${i + 1}`;
        }
        rows.push(r);
      }
      return rows;
    }

    // Otherwise, attempt a low-cost OpenAI call using the preview model
    try {
      const model = process.env.OPENAI_PREVIEW_MODEL || "gpt-4o-mini";
      const systemPrompt = this.buildSystemPrompt(tier, schema);
      const userPrompt = this.buildUserPrompt(
        prompt,
        Math.min(10, rowCount),
        schema
      );
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      });
      const content = completion.choices[0]?.message?.content;
      if (!content) return [];
      return this.parseResponse(content);
    } catch (e) {
      logger.warn(
        "OpenAI preview failed, falling back to synthetic preview",
        e
      );
      // fallback synthetic
      const rows: any[] = [];
      for (let i = 0; i < Math.min(10, rowCount); i++) {
        const r: any = { previewIndex: i + 1 };
        if (schema && Array.isArray(schema.fields)) {
          for (const f of schema.fields) {
            const name =
              f.name ||
              f.field ||
              `col_${Math.random().toString(36).slice(2, 6)}`;
            r[name] = `${name}_sample_${i + 1}`;
          }
        } else {
          r[`sample_${i + 1}`] = `${prompt?.slice(0, 30) || "data"}_${i + 1}`;
        }
        rows.push(r);
      }
      return rows;
    }
  }

  async generateDataset(request: GenerationRequest): Promise<any[]> {
    const { prompt, schema, tier, rowCount = 100 } = request;

    const systemPrompt = this.buildSystemPrompt(tier, schema);
    const userPrompt = this.buildUserPrompt(prompt, rowCount, schema);
    logger.info(`🤖 OpenAI generation started: ${tier} tier, ${rowCount} rows`);
    // If client unavailable, fall back to synthetic generation
    if (!this.client) {
      logger.warn("OpenAI client unavailable; using synthetic generation fallback.");
      const rows: any[] = [];
      for (let i = 0; i < Math.max(1, Math.min(1000, rowCount)); i++) {
        const r: any = { index: i + 1 };
        if (schema && Array.isArray(schema.fields)) {
          for (const f of schema.fields) {
            const name = f.name || f.field || `col_${Math.random().toString(36).slice(2, 6)}`;
            r[name] = `${name}_generated_${i + 1}`;
          }
        } else {
          r[`generated_${i + 1}`] = `${prompt?.slice(0, 30) || "data"}_${i + 1}`;
        }
        rows.push(r);
      }
      return rows;
    }

    const completion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "4096"),
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");
    return this.parseResponse(content);
  }

  private buildSystemPrompt(tier: string, schema?: any): string {
    let prompt =
      "You are a synthetic data generation expert. Generate realistic, diverse, and high-quality data.";

    if (tier === "workflow") {
      prompt +=
        " Ensure data passes validation checks and maintains consistency.";
    } else if (tier === "production") {
      prompt +=
        " Generate enterprise-grade data with statistical validity and compliance markers.";
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
    // Remove markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      logger.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid JSON response from AI");
    }
  }
}
