import { createServer } from "node:http";
import { spawn } from "node:child_process";

const port = 18001;
const businessPort = 18002;
const base = `http://127.0.0.1:${port}`;
const businessBase = `http://127.0.0.1:${businessPort}`;
const business = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  res.writeHead(202, { "content-type": "application/json" });
  res.end(JSON.stringify({ method: req.method, path: req.url, body, idempotency: req.headers["idempotency-key"] || null }));
});
await new Promise((resolve) => business.listen(businessPort, "127.0.0.1", resolve));
const child = spawn(process.execPath, ["local-backend/server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, BACKEND_PORT: String(port), BUSINESS_BACKEND_URL: businessBase },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local backend did not become healthy");
}

async function get(pathname) {
  const response = await fetch(`${base}${pathname}`);
  if (!response.ok) throw new Error(`${pathname} returned ${response.status}`);
  return response.json();
}

async function post(pathname, payload) {
  const response = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": "proxy-test" },
    body: JSON.stringify(payload),
  });
  if (response.status !== 202) throw new Error(`${pathname} proxy returned ${response.status}`);
  return response.json();
}

try {
  await waitForHealth();
  for (const domain of ["institutions", "scholars", "students", "projects", "events", "venues"]) {
    const data = await get(`/api/${domain}?page=1&page_size=10`);
    if (!Array.isArray(data.items) || data.items.length > 10) throw new Error(`${domain} response is invalid`);
  }
  const institutions = await get("/api/institutions?page=1&page_size=10");
  if (institutions.items[0]) await get(`/api/institutions/${encodeURIComponent(institutions.items[0].id)}`);
  const scholars = await get("/api/scholars?page=1&page_size=10");
  if (scholars.items[0]) await get(`/api/scholars/${encodeURIComponent(scholars.items[0].url_hash)}`);
  const students = await get("/api/students?page=1&page_size=10");
  if (students.items[0]) await get(`/api/students/${encodeURIComponent(students.items[0].id)}`);
  await get("/api/institutions/taxonomy");
  await get("/api/institutions?view=hierarchy");
  await get("/api/scholars/stats");
  await get("/api/students/options");
  await get("/api/projects/taxonomy");
  await get("/api/events/stats");
  await get("/api/events/taxonomy");
  const proxy = await post("/api/portrait-assessments", { source_record_type: "student", source_record_id: "student-1", requested_by: "test" });
  if (proxy.path !== "/api/portrait-assessments" || proxy.idempotency !== "proxy-test") throw new Error("Portrait proxy did not preserve request metadata");
  const projectData = await get("/api/projects?page=1&page_size=10");
  if (projectData.total !== 0) throw new Error("Expected the project snapshot to remain empty");
  console.log(JSON.stringify({ ok: true, base }, null, 2));
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => business.close(resolve));
}
