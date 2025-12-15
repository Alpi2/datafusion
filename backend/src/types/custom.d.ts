declare module "@anthropic-ai/sdk";
declare module "@google/generative-ai";
declare module "pdf-parse";
declare module "mammoth";
declare module "multer";
declare module "tiktoken";

declare global {
  namespace Express {
    interface Multer {
      File: any;
    }
    interface Request {
      file?: any;
    }
  }
}

export {};
