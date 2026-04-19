import app from "./app.js";
import { env } from "./config/env.js"; // dotenv loads inside here now
import { connectDB } from "./config/db.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("🔥 SERVER START ERROR:");
    console.error(error); // full object
    console.error((error as any)?.message); // message
    console.error((error as any)?.stack); // stack

    process.exit(1);
  }
};

startServer();
