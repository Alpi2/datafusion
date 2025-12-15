import rateLimit from "express-rate-limit";

// General API rate limiter (less strict)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // allow more requests for general endpoints
});

// Auth-specific limiter (stricter for production-sensitive endpoints)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit to 20 requests per 15 minutes for auth endpoints
  message: { error: "Too many auth attempts, please try again later" },
});
