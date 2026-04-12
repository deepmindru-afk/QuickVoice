import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";
import morgan from "morgan";
import { Request } from "express";
const app = express();
app.use(morgan("dev", {
	skip: (req: Request) => req.method === "OPTIONS"
  }));
const port = process.env.PORT! || 5000;
const apiVersion = process.env.API_VERSION! || "v1";

import authMiddleware  from "./middleware/authMiddleware.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
app.use(
	cors({
		origin: "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	})
);

app.all(`/api/${apiVersion}/auth/*splat`, toNodeHandler(auth));

app.use(express.json());



app.get("/", (req, res) => {
	res.send("Hello World");
});

app.use(notFound);
app.use(errorHandler);
app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});