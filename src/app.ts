import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "crypto";
import routes from "./routes/index.js";
import { Request, Response, NextFunction } from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { env } from "./config/env.js";

const app = express();

const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req: Request, res: Response) => {
  res.send("Server running...");
});

app.get("/", (req: Request, res: Response) => {
  res.send("Server running...");
});

app.use("/api", routes);
app.use(errorMiddleware);

export default app;
