import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const snapshotFile = path.join(rootDir, "local-backend", "data", "snapshot.json");
const snapshot = JSON.parse(await fs.readFile(snapshotFile, "utf8"));
const domains = ["institutions", "scholars", "students", "projects", "events", "venues"];
const sensitive = /^(email|phone|password|token|access_token|client_secret|api_key|authorization)$/i;
const failures = [];

function walk(value, pathName = "") {
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${pathName}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (sensitive.test(key) && item) failures.push(`sensitive field: ${pathName}.${key}`);
    walk(item, `${pathName}.${key}`);
  }
}

for (const domain of domains) {
  const items = snapshot[domain]?.items;
  if (!Array.isArray(items)) failures.push(`${domain}.items is missing`);
  else if (items.length > 10) failures.push(`${domain} has ${items.length} items`);
}
walk(snapshot);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, counts: Object.fromEntries(domains.map((domain) => [domain, snapshot[domain].items.length])) }, null, 2));
}
