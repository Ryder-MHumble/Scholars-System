import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScholarDetail } from "@/services/scholarApi";
import { RightSidebar } from "./RightSidebar";

const mocks = vi.hoisted(() => ({
  fetchScholarActivities: vi.fn(),
  fetchScholarNews: vi.fn(),
  createScholarNews: vi.fn(),
  batchScholarNews: vi.fn(),
  updateScholarNews: vi.fn(),
  deleteScholarNews: vi.fn(),
  patchScholarDetail: vi.fn(),
}));

vi.mock("@/services/scholarApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/scholarApi")>()),
  patchScholarDetail: mocks.patchScholarDetail,
}));

vi.mock("@/services/activityApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/activityApi")>()),
  fetchScholarActivities: mocks.fetchScholarActivities,
}));

vi.mock("@/services/scholarResourcesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/scholarResourcesApi")>()),
  fetchScholarNews: mocks.fetchScholarNews,
  createScholarNews: mocks.createScholarNews,
  batchScholarNews: mocks.batchScholarNews,
  updateScholarNews: mocks.updateScholarNews,
  deleteScholarNews: mocks.deleteScholarNews,
}));

const scholar = {
  url_hash: "scholar-1",
  coauthors: [],
  adjunct_supervisor: { status: "" },
} as unknown as ScholarDetail;

function renderSidebar(value = scholar) {
  return render(
    <MemoryRouter initialEntries={["/scholars/scholar-1"]}>
      <RightSidebar scholar={value} />
    </MemoryRouter>,
  );
}

describe("RightSidebar relation tabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchScholarActivities.mockResolvedValue([]);
    mocks.fetchScholarNews.mockResolvedValue([]);
    mocks.createScholarNews.mockResolvedValue({});
    mocks.batchScholarNews.mockResolvedValue({
      total: 2,
      created: 2,
      updated: 0,
      skipped: 0,
      pending_match: 0,
      failed: 0,
      rows: [
        { row: 1, status: "created", item_id: "n1", error: "" },
        { row: 2, status: "created", item_id: "n2", error: "" },
      ],
    });
    mocks.updateScholarNews.mockResolvedValue({});
    mocks.deleteScholarNews.mockResolvedValue(undefined);
    mocks.patchScholarDetail.mockResolvedValue({});
  });

  it("keeps the sidebar cardless with two responsive relationship tabs", () => {
    renderSidebar();

    const sidebar = screen.getByRole("complementary");
    expect(sidebar.className).toContain("w-full");
    expect(sidebar.className).toContain("xl:w-80");
    expect(sidebar.firstElementChild?.className).not.toContain("rounded-xl");
    expect(sidebar.firstElementChild?.className).not.toContain("shadow-sm");

    const tabs = [
      screen.getByRole("button", { name: /合作学者/ }),
      screen.getByRole("button", { name: /学者活动/ }),
    ];
    expect(tabs[0].parentElement?.className).toContain("grid-cols-2");
    tabs.forEach((tab) => {
      expect(tab.className).toContain("min-w-0");
      expect(tab.className).toContain("whitespace-nowrap");
    });
    expect(screen.queryByRole("button", { name: /学院活动/ })).toBeNull();
    expect(screen.getByRole("button", { name: "编辑学者关系" })).toBeTruthy();
    expect(screen.queryByText(/\d+\s*(人|条)/)).toBeNull();
  });

  it("opens a relationship manager modal and deletes a coauthor through the scholar API", async () => {
    const withCoauthor = {
      ...scholar,
      coauthors: [
        {
          aminer_id: "coauthor-1",
          name: "Ada Scholar",
          name_zh: "艾达",
          weight: 3,
        },
      ],
    } as ScholarDetail;
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderSidebar(withCoauthor);
    fireEvent.click(screen.getByRole("button", { name: "编辑学者关系" }));

    expect(screen.getByRole("heading", { name: "编辑学者关系" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "删除合作学者：艾达" }));

    await waitFor(() =>
      expect(mocks.patchScholarDetail).toHaveBeenCalledWith("scholar-1", {
        coauthors: [],
      }),
    );
    expect(confirm).toHaveBeenCalledWith("确认删除合作学者“艾达”？");
  });

  it("renders approved scholar activities newest first", async () => {
    mocks.fetchScholarNews.mockResolvedValue([
      {
        id: "older",
        scholar_id: "scholar-1",
        title: "较早活动",
        published_at: "2026-09-01T00:00:00Z",
        review_status: "approved",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      },
      {
        id: "pending",
        scholar_id: "scholar-1",
        title: "待审核活动",
        published_at: "2026-09-09T00:00:00Z",
        review_status: "pending",
        created_at: "2026-09-09T00:00:00Z",
        updated_at: "2026-09-09T00:00:00Z",
      },
      {
        id: "newer",
        scholar_id: "scholar-1",
        title: "最新活动",
        published_at: "2026-09-07T00:00:00Z",
        review_status: "approved",
        created_at: "2026-09-07T00:00:00Z",
        updated_at: "2026-09-07T00:00:00Z",
      },
    ]);

    renderSidebar();

    expect(screen.getByRole("button", { name: /合作学者/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /学者活动/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /学者活动/ }));
    expect(await screen.findByText("最新活动")).toBeTruthy();
    expect(screen.getByText("较早活动")).toBeTruthy();
    expect(screen.queryByText("待审核活动")).toBeNull();
    const titles = screen.getAllByTestId("news-title").map((node) => node.textContent);
    expect(titles).toEqual(["最新活动", "较早活动"]);
  });

  it("shows a News load error and retries only News", async () => {
    mocks.fetchScholarNews
      .mockRejectedValueOnce(new Error("News service unavailable"))
      .mockResolvedValueOnce([]);

    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /学者活动/ }));
    fireEvent.click(screen.getByRole("button", { name: "编辑学者关系" }));

    expect(await screen.findByText("News service unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "重试学者活动" }));

    await waitFor(() => expect(mocks.fetchScholarNews).toHaveBeenCalledTimes(2));
    expect(mocks.fetchScholarActivities).not.toHaveBeenCalled();
    expect((await screen.findAllByText("暂无学者活动")).length).toBeGreaterThan(0);
  });

  it("creates News and refreshes the News list", async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /学者活动/ }));
    fireEvent.click(screen.getByRole("button", { name: "编辑学者关系" }));
    await screen.findByText("暂无学者活动");

    fireEvent.click(screen.getByRole("button", { name: "新增学者活动" }));
    fireEvent.change(screen.getByLabelText("标题 *"), {
      target: { value: "新建 News" },
    });
    fireEvent.change(screen.getByLabelText("发布日期 *"), {
      target: { value: "2026-09-07" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(mocks.createScholarNews).toHaveBeenCalledWith(
        "scholar-1",
        expect.objectContaining({
          title: "新建 News",
          published_at: "2026-09-07T00:00:00Z",
        }),
      ),
    );
    await waitFor(() => expect(mocks.fetchScholarNews).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("新增学者活动")).toBeNull();
  });

  it("updates and deletes an approved News item", async () => {
    mocks.fetchScholarNews.mockResolvedValue([
      {
        id: "news-1",
        scholar_id: "scholar-1",
        title: "原始标题",
        published_at: "2026-09-01T00:00:00Z",
        review_status: "approved",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      },
    ]);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /学者活动/ }));
    fireEvent.click(screen.getByRole("button", { name: "编辑学者关系" }));
    expect((await screen.findAllByText("原始标题")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "编辑 原始标题" }));
    fireEvent.change(screen.getByLabelText("标题 *"), {
      target: { value: "更新标题" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(mocks.updateScholarNews).toHaveBeenCalledWith(
        "scholar-1",
        "news-1",
        expect.objectContaining({ title: "更新标题" }),
      ),
    );
    await waitFor(() => expect(mocks.fetchScholarNews).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("button", { name: "删除 原始标题" }));
    await waitFor(() =>
      expect(mocks.deleteScholarNews).toHaveBeenCalledWith("scholar-1", "news-1"),
    );
    await waitFor(() => expect(mocks.fetchScholarNews).toHaveBeenCalledTimes(3));
    expect(confirm).toHaveBeenCalledWith("确认删除“原始标题”？");
  });

  it("refreshes only News after a successful batch import", async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /学者活动/ }));
    fireEvent.click(screen.getByRole("button", { name: "编辑学者关系" }));
    await screen.findByText("暂无学者活动");

    fireEvent.click(screen.getByRole("button", { name: "批量识别学者活动" }));
    fireEvent.change(screen.getByLabelText("粘贴学者活动文本"), {
      target: {
        value:
          "活动A | 2026-09-08 | 动态 | 摘要A\n标题：活动B；日期：2026/09/09；类型：获奖；摘要：摘要B",
      },
    });
    expect(await screen.findByText("自动识别预览 2 条")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "提交 2 条" }));

    await waitFor(() =>
      expect(mocks.batchScholarNews).toHaveBeenCalledWith(
        "scholar-1",
        expect.arrayContaining([
          expect.objectContaining({
            title: "活动A",
            published_at: "2026-09-08T00:00:00Z",
            review_status: "approved",
          }),
          expect.objectContaining({
            title: "活动B",
            published_at: "2026-09-09T00:00:00Z",
          }),
        ]),
      ),
    );
    await waitFor(() => expect(mocks.fetchScholarNews).toHaveBeenCalledTimes(2));
    expect(mocks.fetchScholarActivities).not.toHaveBeenCalled();
  });
});
