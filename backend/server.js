import { configDotenv } from "dotenv";
configDotenv()

import connectDatabase from "./src/database/database.js";
import app from "./src/app.js"

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Música API - porta ${PORT}`);
  });
}

start();