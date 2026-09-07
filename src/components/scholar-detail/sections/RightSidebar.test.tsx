import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScholarDetail } from "@/services/scholarApi";
import { RightSidebar } from "./RightSidebar";

const mocks = vi.hoisted(() => ({
  fetchScholarActivities: vi.fn(),
  fetchScholarNews: vi.fn(),
  createScholarNews: vi.fn(),
  updateScholarNews: vi.fn(),
  deleteScholarNews: vi.fn(),
}));

vi.mock("@/services/activityApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/activityApi")>()),
  fetchScholarActivities: mocks.fetchScholarActivities,
}));

vi.mock("@/services/scholarResourcesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/scholarResourcesApi")>()),
  fetchScholarNews: mocks.fetchScholarNews,
  createScholarNews: mocks.createScholarNews,
  updateScholarNews: mocks.updateScholarNews,
  deleteScholarNews: mocks.deleteScholarNews,
}));

vi.mock("@/components/scholar-detail/modals/NewsBatchImportModal", () => ({
  NewsBatchImportModal: ({
    isOpen,
    onSuccess,
  }: {
    isOpen: boolean;
    onSuccess: () => void;
  }) =>
    isOpen ? (
      <button type="button" onClick={onSuccess}>
        模拟批量导入成功
      </button>
    ) : null,
}));

const scholar = {
  url_hash: "scholar-1",
  coauthors: [],
  adjunct_supervisor: { status: "" },
} as unknown as ScholarDetail;

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/scholars/scholar-1"]}>
      <RightSidebar scholar={scholar} />
    </MemoryRouter>,
  );
}

describe("RightSidebar relation tabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchScholarActivities.mockResolvedValue([]);
    mocks.fetchScholarNews.mockResolvedValue([]);
    mocks.createScholarNews.mockResolvedValue({});
    mocks.updateScholarNews.mockResolvedValue({});
    mocks.deleteScholarNews.mockResolvedValue(undefined);
  });

  it("keeps the sidebar and its three tabs responsive", () => {
    renderSidebar();

    const sidebar = screen.getByRole("complementary");
    expect(sidebar.className).toContain("w-full");
    expect(sidebar.className).toContain("xl:w-80");

    const tabs = [
      screen.getByRole("button", { name: /合作学者/ }),
      screen.getByRole("button", { name: /学者 News/ }),
      screen.getByRole("button", { name: /学院活动/ }),
    ];
    expect(tabs[0].parentElement?.className).toContain("grid-cols-3");
    tabs.forEach((tab) => {
      expect(tab.className).toContain("min-w-0");
      expect(tab.className).toContain("whitespace-nowrap");
    });
  });

  it("renders three independent tabs and approved News newest first", async () => {
    mocks.fetchScholarNews.mockResolvedValue([
      {
        id: "older",
        scholar_id: "scholar-1",
        title: "较早 News",
        published_at: "2026-09-01T00:00:00Z",
        review_status: "approved",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      },
      {
        id: "pending",
        scholar_id: "scholar-1",
        title: "待审核 News",
        published_at: "2026-09-09T00:00:00Z",
        review_status: "pending",
        created_at: "2026-09-09T00:00:00Z",
        updated_at: "2026-09-09T00:00:00Z",
      },
      {
        id: "newer",
        scholar_id: "scholar-1",
        title: "最新 News",
        published_at: "2026-09-07T00:00:00Z",
        review_status: "approved",
        created_at: "2026-09-07T00:00:00Z",
        updated_at: "2026-09-07T00:00:00Z",
      },
    ]);

    renderSidebar();

    expect(screen.getByRole("button", { name: /合作学者/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /学者 News/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /学院活动/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /学者 News/ }));
    expect(await screen.findByText("最新 News")).toBeTruthy();
    expect(screen.getByText("较早 News")).toBeTruthy();
    expect(screen.queryByText("待审核 News")).toBeNull();
    const titles = screen.getAllByTestId("news-title").map((node) => node.textContent);
    expect(titles).toEqual(["最新 News", "较早 News"]);
  });

  it("shows a News load error and retries only News", async () => {
    mocks.fetchScholarNews
      .mockRejectedValueOnce(new Error("News service unavailable"))
      .mockResolvedValueOnce([]);

    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /学者 News/ }));

    expect(await screen.findByText("News service unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "重试学者 News" }));

    await waitFor(() => expect(mocks.fetchScholarNews).toHaveBeenCalledTimes(2));
    expect(mocks.fetchScholarActivities).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("暂无学者 News")).toBeTruthy();
  });

  it("keeps activity failures distinct from an empty list", async () => {
    mocks.fetchScholarActivities.mockRejectedValueOnce(
      new Error("Activity service unavailable"),
    );

    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /学院活动/ }));

    expect(await screen.findByText("Activity service unavailable")).toBeTruthy();
    expect(screen.queryByText("暂无学院活动")).toBeNull();
  });

  it("creates News and refreshes the News list", async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: /学者 News/ }));
    await screen.findByText("暂无学者 News");

    fireEvent.click(screen.getByRole("button", { name: "新增学者 News" }));
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
    expect(screen.queryByText("新增学者 News")).toBeNull();
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
    fireEvent.click(screen.getByRole("button", { name: /学者 News/ }));
    await screen.findByText("原始标题");

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
    fireEvent.click(screen.getByRole("button", { name: /学者 News/ }));
    await screen.findByText("暂无学者 News");

    fireEvent.click(screen.getByRole("button", { name: "批量导入" }));
    fireEvent.click(screen.getByRole("button", { name: "模拟批量导入成功" }));

    await waitFor(() => expect(mocks.fetchScholarNews).toHaveBeenCalledTimes(2));
    expect(mocks.fetchScholarActivities).toHaveBeenCalledTimes(1);
  });
});
