// ================================
// src/middlewares/rateLimit.middleware.ts
// ================================

import rateLimit from "express-rate-limit";

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // per IP
  message: {
    success: false,
    message: "Too many requests, try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default rateLimitMiddleware;