import type { AppConfig } from "./config.js";
import { asArray, asRecord } from "./utils.js";

export interface DeanAgentResponse {
  endpoint: string;
  fetchedAt: string;
  body: unknown;
}

export class DeanAgentClient {
  constructor(private readonly config: AppConfig) {}

  async get(path: string): Promise<DeanAgentResponse> {
    const endpoint = path.startsWith("/") ? path : `/${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const headers: Record<string, string> = { accept: "application/json" };
      if (this.config.deanAgentToken) headers.authorization = `Bearer ${this.config.deanAgentToken}`;
      const response = await fetch(`${this.config.deanAgentBaseUrl}${endpoint}`, {
        headers,
        signal: controller.signal,
      });
      const text = await response.text();
      let body: unknown = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      if (!response.ok) {
        throw new Error(`DeanAgent ${endpoint} returned ${response.status}`);
      }
      return { endpoint, fetchedAt: new Date().toISOString(), body };
    } finally {
      clearTimeout(timeout);
    }
  }

  async loadScholar(recordId: string): Promise<DeanAgentResponse[]> {
    const encoded = encodeURIComponent(recordId);
    return Promise.all([
      this.get(`/api/scholars/${encoded}`),
      this.get(`/api/scholars/${encoded}/publications?page=1&page_size=100&sort_by=publication_date&order=desc`),
    ]);
  }

  async loadStudent(recordId: string): Promise<DeanAgentResponse[]> {
    const encoded = encodeURIComponent(recordId);
    return Promise.all([
      this.get(`/api/students/${encoded}`),
      this.get(`/api/students/${encoded}/papers`),
    ]);
  }

  async loadAcademicStudent(recordId: string): Promise<DeanAgentResponse[]> {
    const encoded = encodeURIComponent(recordId);
    const listing = await this.get(
      `/academic-monitor/api/students?keyword=${encoded}&page=1&page_size=100`,
    );
    const listBody = asRecord(listing.body);
    const exact = asArray(listBody.items).find(
      (item) => asRecord(item).target_key === recordId,
    );
    if (!exact) throw new Error(`DeanAgent academic student ${recordId} was not found`);
    const papers = await this.get(`/academic-monitor/api/students/${encoded}/papers`);
    return [{ ...listing, body: exact }, papers];
  }
}
