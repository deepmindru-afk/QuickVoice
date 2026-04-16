import "dotenv/config";
import express, { Request } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

import authMiddleware from "./middleware/auth.middleware.js";
import notFound from "./middleware/notFound.middleware.js";
import errorHandler from "./middleware/error.middleware.js";
import rateLimitMiddleware from "./middleware/rateLimit.middleware.js";

import { serve as serveInngest } from "inngest/express";
import { inngest } from "./config/inngest.js";
import { inngestFunctions } from "./inngest/index.js";
import apiRouter from "./router.js";

const app = express();

const port = process.env.PORT || 5000;
const apiVersion = process.env.API_VERSION || "v1";

/**
 * =========================
 * Global Middlewares
 * =========================
 */

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Request logger
app.use(
  morgan("dev", {
    skip: (req: Request) => req.method === "OPTIONS",
  })
);

/**
 * =========================
 * Auth Routes
 * =========================
 *
 * Better Auth handler MUST be mounted BEFORE express.json() — otherwise
 * client API requests get stuck in a pending state.
 * See: https://better-auth.com/docs/integrations/express
 */

app.all(`/api/${apiVersion}/auth/*splat`, toNodeHandler(auth));

// Body parser (after Better Auth handler)
app.use(express.json());

// Rate limit
app.use(rateLimitMiddleware);
// Inngest serve handler — exposes functions for remote invocation.
// Must be after express.json() so Inngest can read request bodies.
app.use(
  `/api/inngest`,
  serveInngest({ client: inngest, functions: inngestFunctions })
);
/**
 * =========================
 * Public Routes
 * =========================
 */

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get(`/api/${apiVersion}/health`, (req, res) => {
  res.json({
    success: true,
    message: "Server running fine",
  });
});

/**
 * =========================
 * Protected Routes Example
 * =========================
 */

app.get(
  `/api/${apiVersion}/me`,
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      message: "Protected route access granted",
    });
  }
);

/**
 * =========================
 * Module Routes
 * =========================
 */

app.use(`/api/${apiVersion}`, apiRouter);



/**
 * =========================
 * 404 + Error Handler
 * =========================
 */

app.use(notFound);
app.use(errorHandler);

/**
 * =========================
 * Start Server
 * =========================
 */

app.listen(port, () => {
  console.log(
    `Server listening on http://localhost:${port}`
  );
});