import express from "express";
import morgan from "morgan";
import routes from "./routes/index.js";
import { Request, Response } from "express";

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req: Request, res: Response) => {
  res.send("Server running...");
});

app.get("/", (req: Request, res: Response) => {
  res.send("Server running...");
});

app.use("/api", routes);

export default app;
