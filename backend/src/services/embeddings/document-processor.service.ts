import fs from "fs";
import path from "path";
// @ts-ignore - optional runtime dependency
import pdf from "pdf-parse";
// @ts-ignore - optional runtime dependency
import mammoth from "mammoth";
import { logger } from "../../shared/utils/logger";

export class DocumentProcessorService {
  async extractText(filePath: string, fileType: string): Promise<string> {
    logger.info(`📄 Extracting text from ${fileType} file: ${filePath}`);
    try {
      switch (fileType) {
        case "application/pdf":
          return await this.extractFromPDF(filePath);
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        case "application/msword":
          return await this.extractFromDOCX(filePath);
        case "text/plain":
          return await this.extractFromTXT(filePath);
        case "application/json":
          return await this.extractFromJSON(filePath);
        case "text/csv":
          return await this.extractFromCSV(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      logger.error("Document extraction failed:", error);
      throw error;
    }
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  private async extractFromDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async extractFromTXT(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, "utf-8");
  }

  private async extractFromJSON(filePath: string): Promise<string> {
    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);
    return JSON.stringify(json, null, 2);
  }

  private async extractFromCSV(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, "utf-8");
  }

  async analyzeContent(text: string): Promise<{
    topics: string[];
    keyTerms: string[];
    dataStructures: string[];
  }> {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      if (word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    // Detect data structures
    const dataStructures: string[] = [];
    if (text.includes("{") && text.includes("}")) dataStructures.push("JSON");
    if (text.includes(",") && text.includes("\n")) dataStructures.push("CSV");
    if (text.includes("table") || text.includes("column"))
      dataStructures.push("Relational");
    return {
      topics: sortedWords.slice(0, 5),
      keyTerms: sortedWords.slice(0, 10),
      dataStructures,
    };
  }
}

export default new DocumentProcessorService();
