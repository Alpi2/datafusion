import { logger } from "../../shared/utils/logger";
import { ValidationResult } from "../ai/types";

export class ValidationService {
  async validateDataset(
    data: any[],
    schema: any,
    level: "standard" | "enhanced" | "enterprise" | "regulatory"
  ): Promise<ValidationResult> {
    logger.info(`🔍 Validating dataset with ${level} level`);
    const errors: string[] = [];
    const warnings: string[] = [];
    // 1. Schema compliance
    const schemaErrors = this.validateSchema(data, schema);
    errors.push(...schemaErrors);
    // 2. Data type consistency
    const typeErrors = this.validateDataTypes(data, schema);
    errors.push(...typeErrors);
    // 3. Missing values
    const missingWarnings = this.checkMissingValues(data);
    warnings.push(...missingWarnings);
    // 4. Duplicates
    const duplicateWarnings = this.checkDuplicates(data);
    warnings.push(...duplicateWarnings);
    if (
      level === "enhanced" ||
      level === "enterprise" ||
      level === "regulatory"
    ) {
      // 5. Statistical analysis
      const statWarnings = this.performStatisticalAnalysis(data);
      warnings.push(...statWarnings);
      // 6. Outlier detection
      const outlierWarnings = this.detectOutliers(data);
      warnings.push(...outlierWarnings);
    }
    if (level === "enterprise" || level === "regulatory") {
      // 7. Advanced checks
      const advancedErrors = this.performAdvancedChecks(data);
      errors.push(...advancedErrors);
    }
    // Compute per-field metrics
    const fieldMetrics = this.computeFieldMetrics(data, schema);

    const score = this.calculateValidationScore(errors, warnings, level);
    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      fieldMetrics,
    };
  }
  private computeFieldMetrics(data: any[], schema: any) {
    const metrics: any[] = [];
    const total = data.length || 0;
    const fields =
      schema?.fields?.map((f: any) => f.name) || Object.keys(data[0] || {});

    for (const field of fields) {
      const values = data.map((r) => r[field]);
      const nullCount = values.filter(
        (v) => v === null || v === undefined || v === ""
      ).length;
      const nonNullValues = values.filter(
        (v) => v !== null && v !== undefined && v !== ""
      );
      const sampleCount = nonNullValues.length;
      const uniqueCount = new Set(nonNullValues.map((v) => JSON.stringify(v)))
        .size;
      const uniquenessRate = sampleCount > 0 ? uniqueCount / sampleCount : 0;
      const nullRate = total > 0 ? nullCount / total : 0;

      // numeric stats
      const numericVals = nonNullValues.filter(
        (v) => typeof v === "number"
      ) as number[];
      let mean: number | undefined = undefined;
      let variance: number | undefined = undefined;
      let stdDev: number | undefined = undefined;
      let min: number | undefined = undefined;
      let max: number | undefined = undefined;
      let outlierCount: number | undefined = undefined;

      if (numericVals.length > 0) {
        const sum = numericVals.reduce((a, b) => a + b, 0);
        mean = sum / numericVals.length;
        variance =
          numericVals.reduce(
            (a, b) => a + Math.pow(b - (mean as number), 2),
            0
          ) / numericVals.length;
        stdDev = Math.sqrt(variance);
        min = Math.min(...numericVals);
        max = Math.max(...numericVals);

        if (numericVals.length >= 4) {
          const sorted = [...numericVals].sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const lower = q1 - 1.5 * iqr;
          const upper = q3 + 1.5 * iqr;
          outlierCount = numericVals.filter(
            (v) => v < lower || v > upper
          ).length;
        } else {
          outlierCount = 0;
        }
      }

      metrics.push({
        fieldName: field,
        sampleCount,
        nullCount,
        nullRate,
        uniqueCount,
        uniquenessRate,
        mean,
        variance,
        stdDev,
        min,
        max,
        outlierCount,
      });
    }

    return metrics;
  }
  private validateSchema(data: any[], schema: any): string[] {
    const errors: string[] = [];
    if (!schema?.fields) return errors;
    const requiredFields = schema.fields
      .filter((f: any) => f.required)
      .map((f: any) => f.name);
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (const field of requiredFields) {
        if (
          !(field in row) ||
          row[field] === null ||
          row[field] === undefined
        ) {
          errors.push(`Row ${i + 1}: Missing required field "${field}"`);
        }
      }
    }
    return errors;
  }
  private validateDataTypes(data: any[], schema: any): string[] {
    const errors: string[] = [];
    if (!schema?.fields) return errors;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      for (const field of schema.fields) {
        const value = row[field.name];
        if (value === null || value === undefined) continue;
        const expectedType = field.type?.toLowerCase();
        const actualType = typeof value;
        if (expectedType === "number" && actualType !== "number") {
          errors.push(
            `Row ${i + 1}: Field "${
              field.name
            }" should be number, got ${actualType}`
          );
        } else if (expectedType === "string" && actualType !== "string") {
          errors.push(
            `Row ${i + 1}: Field "${
              field.name
            }" should be string, got ${actualType}`
          );
        } else if (expectedType === "boolean" && actualType !== "boolean") {
          errors.push(
            `Row ${i + 1}: Field "${
              field.name
            }" should be boolean, got ${actualType}`
          );
        }
      }
    }
    return errors;
  }
  private checkMissingValues(data: any[]): string[] {
    const warnings: string[] = [];
    const fields = Object.keys(data[0] || {});
    for (const field of fields) {
      const missingCount = data.filter(
        (row) =>
          row[field] === null || row[field] === undefined || row[field] === ""
      ).length;
      const percentage = (missingCount / data.length) * 100;
      if (percentage > 10) {
        warnings.push(
          `Field "${field}" has ${percentage.toFixed(1)}% missing values`
        );
      }
    }
    return warnings;
  }
  private checkDuplicates(data: any[]): string[] {
    const warnings: string[] = [];
    const seen = new Set<string>();
    let duplicates = 0;
    for (const row of data) {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }
    if (duplicates > 0) {
      const percentage = (duplicates / data.length) * 100;
      warnings.push(
        `Found ${duplicates} duplicate rows (${percentage.toFixed(1)}%)`
      );
    }
    return warnings;
  }
  private performStatisticalAnalysis(data: any[]): string[] {
    const warnings: string[] = [];
    const fields = Object.keys(data[0] || {});
    for (const field of fields) {
      const values = data
        .map((row) => row[field])
        .filter((v) => typeof v === "number");

      if (values.length === 0) continue;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev === 0) {
        warnings.push(
          `Field "${field}" has zero variance (all values are identical)`
        );
      }
    }
    return warnings;
  }
  private detectOutliers(data: any[]): string[] {
    const warnings: string[] = [];
    const fields = Object.keys(data[0] || {});
    for (const field of fields) {
      const values = data
        .map((row) => row[field])
        .filter((v) => typeof v === "number");

      if (values.length < 10) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      const outliers = values.filter((v) => v < lowerBound || v > upperBound);
      if (outliers.length > 0) {
        const percentage = (outliers.length / values.length) * 100;
        warnings.push(
          `Field "${field}" has ${
            outliers.length
          } outliers (${percentage.toFixed(1)}%)`
        );
      }
    }
    return warnings;
  }
  private performAdvancedChecks(data: any[]): string[] {
    const errors: string[] = [];
    // Check for data consistency patterns
    // This is a placeholder for more advanced checks
    return errors;
  }
  private calculateValidationScore(
    errors: string[],
    warnings: string[],
    level: string
  ): number {
    const baseScores = {
      standard: 94,
      enhanced: 97,
      enterprise: 99,
      regulatory: 99.5,
    };
    let score = baseScores[level as keyof typeof baseScores] || 94;
    // Deduct points for errors and warnings
    score -= errors.length * 2;
    score -= warnings.length * 0.5;
    return Math.max(0, Math.min(100, score));
  }
}

export default new ValidationService();
