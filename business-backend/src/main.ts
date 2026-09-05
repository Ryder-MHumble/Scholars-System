import { createApp } from "./app.js";
import { loadConfig, isModelConfigured } from "./config.js";
import { createDatabase } from "./db.js";
import { DeanAgentClient } from "./deanAgent.js";
import { ChatCompletionsModel } from "./model.js";
import { PortraitRepository } from "./repository.js";
import { AssessmentWorker } from "./worker.js";

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const repository = new PortraitRepository(database);
const app = createApp(config, repository);
const worker = new AssessmentWorker(
  config,
  repository,
  new DeanAgentClient(config),
  new ChatCompletionsModel(config),
);

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info({ signal }, "Shutting down");
  await app.close();
  await worker.stop();
  await database.end();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: config.host, port: config.port });
  if (isModelConfigured(config)) {
    worker.start();
  } else {
    app.log.warn("Portrait worker is disabled because LLM_MODEL or LLM_API_KEY is missing");
  }
} catch (error) {
  app.log.error(error);
  await database.end();
  process.exitCode = 1;
}
