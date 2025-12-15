import { Client } from "minio";
import { logger } from "../../shared/utils/logger";

export class StorageService {
  private client: Client;
  private bucket: string;

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    });
    this.bucket = process.env.MINIO_BUCKET || "datafusion-datasets";
  }

  async initialize() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, "us-east-1");
        logger.info(`✅ MinIO bucket created: ${this.bucket}`);
      } else {
        logger.info(`MinIO bucket exists: ${this.bucket}`);
      }
    } catch (err) {
      logger.error("MinIO initialization error:", err);
      throw err;
    }
  }

  async uploadFile(
    fileName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    await this.client.putObject(this.bucket, fileName, buffer, buffer.length, {
      "Content-Type": contentType,
    } as any);
    return fileName;
  }

  async getPresignedUrl(
    fileName: string,
    expirySeconds = 3600
  ): Promise<string> {
    return await this.client.presignedGetObject(
      this.bucket,
      fileName,
      expirySeconds
    );
  }

  async getPresignedUploadUrl(
    fileName: string,
    expirySeconds = 3600
  ): Promise<string> {
    return await this.client.presignedPutObject(
      this.bucket,
      fileName,
      expirySeconds
    );
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.client.removeObject(this.bucket, fileName);
  }

  async downloadFile(fileName: string): Promise<Buffer> {
    // Retrieve object as stream and concatenate into Buffer
    return new Promise<Buffer>((resolve, reject) => {
      (this.client as any).getObject(
        this.bucket,
        fileName,
        (err: any, stream: any) => {
          if (err) return reject(err);
          const chunks: Buffer[] = [];
          stream.on("data", (chunk: Buffer) => chunks.push(chunk));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", (e: any) => reject(e));
        }
      );
    });
  }
}
