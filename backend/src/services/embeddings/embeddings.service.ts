import OpenAI from "openai";
import prisma from "../../config/database";
import { StorageService } from "../storage/storage.service";
import { DocumentProcessorService } from "./document-processor.service";
import { logger } from "../../shared/utils/logger";
import fs from "fs";
import path from "path";

export class EmbeddingsService {
  private openai: any;
  private storage: StorageService;
  private processor: DocumentProcessorService;
  constructor() {
    // Allow disabling OpenAI for local development via DISABLE_OPENAI
    if (process.env.DISABLE_OPENAI === "true" || !process.env.OPENAI_API_KEY) {
      this.openai = null;
      logger.warn("OpenAI embeddings disabled (DISABLE_OPENAI=true or OPENAI_API_KEY missing). Using stub embeddings.");
    } else {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    this.storage = new StorageService();
    this.processor = new DocumentProcessorService();
  }
  async uploadAndProcessDocument(
    userId: string,
    file: Express.Multer.File
  ): Promise<any> {
    logger.info(
      `📤 Uploading document for user ${userId}: ${file.originalname}`
    );
    // Upload to storage
    const fileName = `knowledge/${userId}/${Date.now()}-${file.originalname}`;
    await this.storage.uploadFile(fileName, file.buffer, file.mimetype);
    const fileUrl = await this.storage.getPresignedUrl(fileName, 86400 * 365); // 1 year
    // Create database record
    const doc = await (prisma as any).knowledgeDocument.create({
      data: {
        userId,
        filename: file.originalname,
        fileUrl,
        fileType: file.mimetype,
        fileSize: BigInt(file.size),
        processed: false,
      } as any,
    });
    // Process asynchronously
    this.processDocumentAsync(doc.id, fileName, file.mimetype);
    return doc;
  }
  private async processDocumentAsync(
    docId: string,
    fileName: string,
    fileType: string
  ) {
    try {
      // Download file temporarily
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempPath = path.join(tempDir, path.basename(fileName));
      const fileBuffer = await this.storage.downloadFile(fileName);
      fs.writeFileSync(tempPath, fileBuffer);
      // Extract text
      const text = await this.processor.extractText(tempPath, fileType);

      // Analyze content
      const metadata = await this.processor.analyzeContent(text);
      // Generate embeddings
      const embeddings = await this.generateEmbeddings(text);
      // Update database
      await prisma.$executeRaw`
        UPDATE knowledge_documents
        SET 
          content_text = ${text},
          embeddings = ${embeddings}::vector,
          metadata = ${JSON.stringify(metadata)}::jsonb,
          processed = true,
          updated_at = NOW()
        WHERE id = ${docId}::uuid
      `;
      // Clean up
      fs.unlinkSync(tempPath);
      logger.info(`✅ Document processed: ${docId}`);
    } catch (error) {
      logger.error(`❌ Document processing failed: ${docId}`, error);

      await (prisma as any).knowledgeDocument.update({
        where: { id: docId },
        data: { processed: false },
      });
    }
  }
  async generateEmbeddings(text: string): Promise<string> {
    // Chunk text if too long (max 8191 tokens for text-embedding-3-small)
    const maxChars = 30000; // ~8000 tokens
    const chunks = this.chunkText(text, maxChars);
    // Generate embeddings for first chunk (or average multiple chunks)
    if (!this.openai) {
      // Return a deterministic stub embedding (zeros) to allow development without OpenAI.
      const EMBEDDING_DIM = 1536;
      const zeros = new Array(EMBEDDING_DIM).fill(0);
      return `[${zeros.join(",")}]`;
    }

    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks[0],
    });
    const embedding = response.data[0].embedding;

    // Convert to PostgreSQL vector format: [0.1, 0.2, ...]
    return `[${embedding.join(",")}]`;
  }
  private chunkText(text: string, maxChars: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + maxChars));
      start += maxChars;
    }
    return chunks;
  }
  async searchSimilarDocuments(
    userId: string,
    query: string,
    limit: number = 5
  ): Promise<any[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbeddings(query);
    // Search using cosine similarity
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        filename,
        content_text,
        metadata,
        1 - (embeddings <=> ${queryEmbedding}::vector) as similarity
      FROM knowledge_documents
      WHERE user_id = ${userId}::uuid
        AND processed = true
        AND embeddings IS NOT NULL
      ORDER BY embeddings <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;
    return results;
  }
  async getKnowledgeContext(
    userId: string,
    prompt: string,
    knowledgeDocumentIds?: string[]
  ): Promise<string> {
    let docs: any[] = [];
    if (
      Array.isArray(knowledgeDocumentIds) &&
      knowledgeDocumentIds.length > 0
    ) {
      // Fetch specific documents by id
      docs = await prisma.$queryRaw<any[]>`
        SELECT id, filename, content_text, metadata
        FROM knowledge_documents
        WHERE user_id = ${userId}::uuid
          AND processed = true
          AND id = ANY(${knowledgeDocumentIds}::uuid[])
      `;
    } else {
      docs = await this.searchSimilarDocuments(userId, prompt, 3);
    }

    if (!docs || docs.length === 0) return "";
    const context = docs
      .map((doc) => {
        const preview = doc.content_text?.slice(0, 500) || "";
        return `Document: ${doc.filename}\n${preview}...`;
      })
      .join("\n\n");
    return `Relevant context from user's documents:\n\n${context}`;
  }
}

export default new EmbeddingsService();
