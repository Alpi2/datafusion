import OpenAI from "openai";
import { logger } from "../../shared/utils/logger";
import { ComplianceCheckResult } from "../ai/types";

export class ComplianceService {
  private openai: any;
  constructor() {
    if (process.env.DISABLE_OPENAI === "true" || !process.env.OPENAI_API_KEY) {
      this.openai = null;
      logger.warn("OpenAI is disabled (DISABLE_OPENAI=true or OPENAI_API_KEY missing). Compliance checks will use stubs.");
    } else {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }
  async checkCompliance(
    data: any[],
    standards: string[]
  ): Promise<ComplianceCheckResult[]> {
    logger.info(
      `🛡️ Checking compliance for standards: ${standards.join(", ")}`
    );
    const results: ComplianceCheckResult[] = [];
    for (const standard of standards) {
      const result = await this.checkStandard(data, standard);
      results.push(result);
    }
    return results;
  }
  private async checkStandard(
    data: any[],
    standard: string
  ): Promise<ComplianceCheckResult> {
    const requirements = this.getStandardRequirements(standard);

    const prompt = `You are a compliance expert. Analyze this dataset for ${standard} compliance.
Dataset sample (first 5 rows):
${JSON.stringify(data.slice(0, 5), null, 2)}
Requirements for ${standard}:
${requirements.join("\n")}
Provide a JSON response with:
{
  "compliant": boolean,
  "score": number (0-100),
  "violations": string[],
  "recommendations": string[]
}`;
    if (!this.openai) {
      logger.warn("ComplianceService: OpenAI disabled, returning conservative stub result.");
      return {
        standard,
        compliant: false,
        score: 0,
        violations: ["OpenAI disabled - stub result"],
        recommendations: ["Manual review required"],
        checkedRules: requirements.map((req: string, idx: number) => ({
          id: `${standard.toLowerCase()}-r${idx + 1}`,
          category: standard,
          description: req,
          passed: false,
        })),
      } as ComplianceCheckResult;
    }

    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const response = completion.choices?.[0]?.message?.content || "{}";

    try {
      const parsed = JSON.parse(response);

      // Map requirements to checkedRules with heuristics based on reported violations
      const violations: string[] = parsed.violations || [];
      const checkedRules = requirements.map((req: string, idx: number) => {
        const id = `${standard.toLowerCase()}-r${idx + 1}`;
        const passed = !violations.some(
          (v: string) =>
            v && v.toLowerCase().includes(req.toLowerCase().split(" ")[0])
        );
        return {
          id,
          category: standard,
          description: req,
          passed,
        };
      });

      return {
        standard,
        compliant: parsed.compliant || false,
        score: parsed.score || 0,
        violations: parsed.violations || [],
        recommendations: parsed.recommendations || [],
        checkedRules,
      };
    } catch (error) {
      logger.error(
        `Failed to parse compliance response for ${standard}:`,
        error
      );
      return {
        standard,
        compliant: false,
        score: 0,
        violations: ["Failed to analyze compliance"],
        recommendations: ["Manual review required"],
        checkedRules: requirements.map((req: string, idx: number) => ({
          id: `${standard.toLowerCase()}-r${idx + 1}`,
          category: standard,
          description: req,
          passed: false,
        })),
      };
    }
  }
  private getStandardRequirements(standard: string): string[] {
    const requirements: Record<string, string[]> = {
      gdpr: [
        "Data minimization principles",
        "Purpose limitation",
        "Storage limitation",
        "Pseudonymization support",
        "Right to be forgotten compliance",
        "Consent management",
      ],
      hipaa: [
        "PHI protection standards",
        "Access control implementation",
        "Audit trail requirements",
        "Data encryption standards",
        "Business associate agreements",
        "Breach notification procedures",
      ],
      ccpa: [
        "Consumer right to know",
        "Right to delete personal information",
        "Right to opt-out of sale",
        "Non-discrimination requirements",
        "Data category disclosure",
        "Third-party sharing transparency",
      ],
      sox: [
        "Financial data accuracy",
        "Internal control assessment",
        "Audit trail maintenance",
        "Data retention policies",
        "Change management controls",
        "Executive certification",
      ],
      "pci-dss": [
        "Secure network maintenance",
        "Cardholder data protection",
        "Vulnerability management",
        "Access control measures",
        "Network monitoring",
        "Information security policy",
      ],
      "iso-27001": [
        "Information security policy",
        "Risk assessment procedures",
        "Security control implementation",
        "Incident management",
        "Business continuity planning",
        "Continuous improvement",
      ],
    };
    return requirements[standard.toLowerCase()] || [];
  }
}

export default new ComplianceService();
