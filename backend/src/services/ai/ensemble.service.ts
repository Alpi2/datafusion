import { OpenAIService } from "./openai.service";
import { ClaudeService } from "./claude.service";
import { GeminiService } from "./gemini.service";
import { logger } from "../../shared/utils/logger";
import { AIGenerationRequest, AIGenerationResponse } from "./types";

export class EnsembleService {
  private openai: OpenAIService;
  private claude: ClaudeService;
  private gemini: GeminiService;
  constructor() {
    this.openai = new OpenAIService();
    this.claude = new ClaudeService();
    this.gemini = new GeminiService();
  }
  async generateWithConsensus(
    request: AIGenerationRequest,
    models: string[]
  ): Promise<{
    data: any[];
    consensusScore: number;
    reports: AIGenerationResponse[];
  }> {
    // Resolve any logical model aliases (e.g., ensemble-validator) to concrete provider model IDs
    const resolvedModels = this.resolveModelIds(models);
    logger.info(
      `🎯 Ensemble generation with ${
        resolvedModels.length
      } models: ${resolvedModels.join(", ")}`
    );
    // Generate data from each selected model
    const promises: Promise<AIGenerationResponse>[] = [];
    for (const modelId of resolvedModels) {
      if (modelId.startsWith("gpt-")) {
        promises.push(this.openai.generateDataset(request));
      } else if (modelId.startsWith("claude-")) {
        promises.push(this.claude.generateDataset(request));
      } else if (modelId.startsWith("gemini-")) {
        promises.push(this.gemini.generateDataset(request));
      }
    }
    const results = await Promise.all(promises);
    // Consensus logic: merge and validate
    const consensusData = this.mergeResults(results);
    const consensusScore = this.calculateConsensusScore(results);
    logger.info(`✅ Consensus achieved with score: ${consensusScore}%`);
    return {
      data: consensusData,
      consensusScore,
      reports: results,
    };
  }
  /**
   * Resolve high-level model identifiers into concrete provider model IDs.
   * For example, `ensemble-validator` expands to a default ensemble list.
   */
  resolveModelIds(models: string[]): string[] {
    const out: string[] = [];
    for (const m of models) {
      if (!m) continue;
      if (m === "ensemble-validator") {
        // Default ensemble used by the UI: OpenAI GPT-4, Anthropic Claude 3.5, Google Gemini Pro
        out.push("gpt-4", "claude-3.5", "gemini-pro");
        continue;
      }
      out.push(m);
    }
    // Deduplicate while preserving order
    return Array.from(new Set(out));
  }
  private mergeResults(results: AIGenerationResponse[]): any[] {
    // Strategy: Use voting for each field value
    // If 2+ models agree on a value, use it; otherwise use first model's value

    if (results.length === 1) return results[0].data;
    const primaryData = results[0].data;
    const mergedData: any[] = [];
    for (let i = 0; i < primaryData.length; i++) {
      const row: any = {};
      const keys = Object.keys(primaryData[i] || {});
      for (const key of keys) {
        const values = results
          .map((r) => r.data[i]?.[key])
          .filter((v) => v !== undefined);

        // Voting: find most common value
        const valueCounts = new Map<any, number>();
        values.forEach((v) => {
          const count = valueCounts.get(v) || 0;
          valueCounts.set(v, count + 1);
        });
        const sortedValues = Array.from(valueCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        );
        row[key] = sortedValues[0]
          ? sortedValues[0][0]
          : results[0].data[i]?.[key]; // Most common value or fallback
      }
      mergedData.push(row);
    }
    return mergedData;
  }
  private calculateConsensusScore(results: AIGenerationResponse[]): number {
    if (results.length === 1) return 100;
    // Calculate agreement percentage across all fields
    let totalFields = 0;
    let agreedFields = 0;
    const primaryData = results[0].data;
    for (let i = 0; i < primaryData.length; i++) {
      const keys = Object.keys(primaryData[i] || {});
      for (const key of keys) {
        totalFields++;
        const values = results.map((r) => r.data[i]?.[key]);

        // Check if at least 2 models agree
        const uniqueValues = new Set(
          values.filter((v) => typeof v !== "undefined")
        );
        if (
          uniqueValues.size <
          values.filter((v) => typeof v !== "undefined").length
        ) {
          agreedFields++;
        }
      }
    }
    return totalFields === 0
      ? 100
      : Math.round((agreedFields / totalFields) * 100);
  }
}

export default new EnsembleService();
