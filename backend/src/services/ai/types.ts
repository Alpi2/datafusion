export type AIResponse = { text: string; stopReason?: string; raw?: any };
export type GenerateOptions = { maxTokens?: number; temperature?: number };

export interface AIGenerationRequest {
  prompt: string;
  schema?: any;
  tier: "basic" | "workflow" | "production";
  rowCount?: number;
  knowledgeContext?: string;
}

export interface AIGenerationResponse {
  provider: "openai" | "claude" | "gemini";
  model: string;
  data: any[];
  metadata: {
    inputTokens: number;
    outputTokens: number;
    raw?: any;
  };
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

export interface FieldMetric {
  fieldName: string;
  sampleCount: number;
  nullCount: number;
  nullRate: number; // 0-1
  uniqueCount: number;
  uniquenessRate: number; // 0-1
  mean?: number;
  variance?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  outlierCount?: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  fieldMetrics?: FieldMetric[];
}

export interface ComplianceCheckResult {
  standard: string;
  compliant: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
}

export interface CheckedRule {
  id: string;
  category: string;
  description: string;
  passed: boolean;
}

export interface ComplianceCheckResult {
  standard: string;
  compliant: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
  checkedRules?: CheckedRule[];
}
