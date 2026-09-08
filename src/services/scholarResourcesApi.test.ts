import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  batchAcademicPositions,
  batchOpenSourceProjects,
  batchResearchProjects,
  batchScholarNews,
  createAcademicPosition,
  createOpenSourceProject,
  createResearchProject,
  createScholarNews,
  deleteAcademicPosition,
  deleteOpenSourceProject,
  deleteResearchProject,
  deleteScholarNews,
  fetchAcademicPositions,
  fetchOpenSourceProjects,
  fetchResearchProjects,
  fetchScholarNews,
  updateAcademicPosition,
  updateOpenSourceProject,
  updateResearchProject,
  updateScholarNews,
} from "./scholarResourcesApi";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("scholar resource API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(jsonResponse([]))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the News collection routes and structured payloads", async () => {
    const fetchMock = vi.mocked(fetch);

    await fetchScholarNews("scholar-1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8001/api/scholars/scholar-1/news",
      expect.objectContaining({ method: "GET" }),
    );

    await createScholarNews("scholar-1", {
      title: "获批重点项目",
      published_at: "2026-09-07T00:00:00Z",
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8001/api/scholars/scholar-1/news",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "获批重点项目",
          published_at: "2026-09-07T00:00:00Z",
        }),
      }),
    );

    await batchScholarNews("scholar-1", [{ title: "News" }]);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8001/api/scholars/scholar-1/news/batch",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rows: [{ title: "News" }] }),
      }),
    );

    await updateScholarNews("scholar-1", "news-1", { summary: "更新摘要" });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8001/api/scholars/scholar-1/news/news-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ summary: "更新摘要" }),
      }),
    );

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await deleteScholarNews("scholar-1", "news-1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8001/api/scholars/scholar-1/news/news-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it.each([
    {
      path: "research-projects",
      list: fetchResearchProjects,
      create: createResearchProject,
      batch: batchResearchProjects,
      update: updateResearchProject,
      remove: deleteResearchProject,
      createPayload: { name: "可信 AI 项目" },
      updatePayload: { status: "active" },
    },
    {
      path: "open-source-projects",
      list: fetchOpenSourceProjects,
      create: createOpenSourceProject,
      batch: batchOpenSourceProjects,
      update: updateOpenSourceProject,
      remove: deleteOpenSourceProject,
      createPayload: { name: "Scholar Graph" },
      updatePayload: { stars: 42 },
    },
    {
      path: "academic-positions",
      list: fetchAcademicPositions,
      create: createAcademicPosition,
      batch: batchAcademicPositions,
      update: updateAcademicPosition,
      remove: deleteAcademicPosition,
      createPayload: { organization: "学会", title: "理事" },
      updatePayload: { is_current: true },
    },
  ])("supports CRUD and batch for $path", async ({
    path,
    list,
    create,
    batch,
    update,
    remove,
    createPayload,
    updatePayload,
  }) => {
    const fetchMock = vi.mocked(fetch);
    const collectionUrl = `http://localhost:8001/api/scholars/scholar%2F1/${path}`;

    await list("scholar/1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      collectionUrl,
      expect.objectContaining({ method: "GET" }),
    );

    await create("scholar/1", createPayload as never);
    expect(fetchMock).toHaveBeenLastCalledWith(
      collectionUrl,
      expect.objectContaining({ method: "POST", body: JSON.stringify(createPayload) }),
    );

    await batch("scholar/1", [createPayload] as never[]);
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${collectionUrl}/batch`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rows: [createPayload] }),
      }),
    );

    await update("scholar/1", "item/1", updatePayload as never);
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${collectionUrl}/item%2F1`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(updatePayload) }),
    );

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await remove("scholar/1", "item/1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      `${collectionUrl}/item%2F1`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("surfaces the server error detail", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ detail: "该学者不存在" }, 404),
    );

    await expect(fetchScholarNews("missing")).rejects.toThrow("该学者不存在");
  });

  it("does not expose a raw route-level Not Found message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ detail: "Not Found" }, 404));

    await expect(fetchAcademicPositions("scholar-1")).rejects.toThrow(
      "学术兼职接口不存在（404），请检查后端版本与路由配置",
    );
  });

  it("formats FastAPI validation details with field paths", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        {
          detail: [
            {
              type: "missing",
              loc: ["body", "title"],
              msg: "Field required",
              input: {},
            },
          ],
        },
        422,
      ),
    );

    await expect(fetchScholarNews("invalid")).rejects.toThrow(
      "body.title: Field required",
    );
  });
});
