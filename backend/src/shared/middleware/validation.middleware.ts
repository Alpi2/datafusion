import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Centralized request validation middleware using Zod.
// Usage: router.post('/x', validateRequest(schema), controller.x)
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Prefer validating body; if schema expects params/query, the schema
      // can validate combined object: { body, query, params }
      const toValidate = req.body ?? {};
      schema.parse(toValidate);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: err.errors,
          },
        });
      }
      return res.status(400).json({ error: "Validation error" });
    }
  };
}

export default { validateRequest };
import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/app-error";

export function validateBody(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (e: any) {
      return next(new ValidationError(e.errors || e.message));
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query as any) as any;
      return next();
    } catch (e: any) {
      return next(new ValidationError(e.errors || e.message));
    }
  };
}

export function validateParams(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params as any) as any;
      return next();
    } catch (e: any) {
      return next(new ValidationError(e.errors || e.message));
    }
  };
}
