import { readdir, readFile } from "node:fs/promises";
import type { Database } from "./db.js";
import { withTransaction } from "./db.js";

export async function runMigrations(database: Database): Promise<string[]> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migrationsUrl = new URL("../migrations/", import.meta.url);
  const files = (await readdir(migrationsUrl))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort();
  const applied: string[] = [];

  for (const name of files) {
    const exists = await database.query<{ name: string }>(
      "SELECT name FROM _schema_migrations WHERE name = $1",
      [name],
    );
    if (exists.rowCount) continue;
    const sql = await readFile(new URL(name, migrationsUrl), "utf8");
    await withTransaction(database, async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO _schema_migrations (name) VALUES ($1)", [name]);
    });
    applied.push(name);
  }
  return applied;
}
