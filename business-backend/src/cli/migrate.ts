import { loadConfig } from "../config.js";
import { createDatabase } from "../db.js";
import { runMigrations } from "../migrations.js";

const config = loadConfig();
const database = createDatabase(config.databaseUrl);

try {
  const applied = await runMigrations(database);
  console.log(applied.length > 0 ? `Applied migrations: ${applied.join(", ")}` : "Database is up to date");
} finally {
  await database.end();
}
