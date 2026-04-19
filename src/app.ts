import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index.js";
import { Request, Response } from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
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
