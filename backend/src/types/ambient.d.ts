declare module "@anthropic-ai/sdk";
declare module "@google/generative-ai";
declare module "pdf-parse";
declare module "mammoth";
declare module "multer";
declare module "tiktoken";
declare module "csv-writer";

// allow Express request.file typing tolerance
declare global {
  namespace Express {
    interface Request {
      file?: any;
    }
    namespace Multer {
      interface File {
        [key: string]: any;
      }
    }
  }
}

export {};
