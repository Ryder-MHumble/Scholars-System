import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { ScholarDetail } from "@/services/scholarApi";
import { AchievementsDetailCard } from "./AchievementsDetailCard";

const mocks = vi.hoisted(() => ({
  fetchResearchProjects: vi.fn(),
  fetchOpenSourceProjects: vi.fn(),
  fetchAcademicPositions: vi.fn(),
  createResearchProject: vi.fn(),
    createOpenSourceProject: vi.fn(),
    createAcademicPosition: vi.fn(),
    batchOpenSourceProjects: vi.fn(),
    batchAcademicPositions: vi.fn(),
  updateResearchProject: vi.fn(),
  updateOpenSourceProject: vi.fn(),
  updateAcademicPosition: vi.fn(),
  deleteResearchProject: vi.fn(),
  deleteOpenSourceProject: vi.fn(),
  deleteAcademicPosition: vi.fn(),
}));

vi.mock("@/services/scholarResourcesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/scholarResourcesApi")>()),
  ...mocks,
}));

const scholar = {
  url_hash: "scholar-1",
  name: "Test Scholar",
  representative_publications: [{ title: "Paper" }],
  patents: [],
  awards: [],
  joint_research_projects: [{ title: "Legacy project" }],
} as unknown as ScholarDetail;

function renderCard(relationSlot?: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AchievementsDetailCard
        scholar={scholar}
        onShowAchievementsModal={vi.fn()}
        relationSlot={relationSlot}
      />
    </MemoryRouter>,
  );
}

describe("AchievementsDetailCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchResearchProjects.mockResolvedValue([
      { id: "research-1", name: "独立科研项目", role: "负责人" },
    ]);
    mocks.fetchOpenSourceProjects.mockResolvedValue([
      {
        id: "oss-1",
        name: "Scholar Toolkit",
        repository_url: "https://github.com/example/toolkit",
        language: "TypeScript",
        stars: 128,
      },
    ]);
    mocks.fetchAcademicPositions.mockResolvedValue([
      {
        id: "position-1",
        organization: "中国计算机学会",
        title: "高级会员",
        is_current: true,
      },
    ]);
    mocks.createResearchProject.mockResolvedValue({ id: "research-new" });
    mocks.createOpenSourceProject.mockResolvedValue({ id: "oss-new" });
    mocks.createAcademicPosition.mockResolvedValue({ id: "position-new" });
    mocks.batchOpenSourceProjects.mockResolvedValue({
      total: 1,
      created: 1,
      updated: 0,
      skipped: 0,
      pending_match: 0,
      failed: 0,
      rows: [{ row: 1, status: "created", item_id: "oss-2", error: "" }],
    });
    mocks.batchAcademicPositions.mockResolvedValue({
      total: 2,
      created: 2,
      updated: 0,
      skipped: 0,
      pending_match: 0,
      failed: 0,
      rows: [
        { row: 1, status: "created", item_id: "position-2", error: "" },
        { row: 2, status: "created", item_id: "position-3", error: "" },
      ],
    });
    mocks.updateResearchProject.mockResolvedValue({ id: "research-1" });
    mocks.updateOpenSourceProject.mockResolvedValue({ id: "oss-1" });
    mocks.updateAcademicPosition.mockResolvedValue({ id: "position-1" });
  });

  it("renders academic positions as an independent module instead of an achievement tab", async () => {
    renderCard();

    expect(screen.getByText("学者成就")).toBeTruthy();
    for (const label of [
      "代表论文",
      "专利",
      "获奖",
      "科研项目",
      "开源项目",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: /科研项目/ }));
    expect(await screen.findByText("独立科研项目")).toBeTruthy();
    expect(screen.queryByText("Legacy project")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /开源项目/ }));
    expect(await screen.findByText("Scholar Toolkit")).toBeTruthy();
    expect(screen.getByRole("link", { name: "打开仓库" }).getAttribute("href")).toBe(
      "https://github.com/example/toolkit",
    );

    expect(screen.queryByTestId("scholar-achievement-tab-positions")).toBeNull();
    const positionsModule = await screen.findByTestId("scholar-academic-positions-module");
    expect(screen.queryByText("中国计算机学会")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "展开学术兼职" }));
    expect(positionsModule.textContent).toContain("中国计算机学会");
    expect(screen.getByText("当前兼职")).toBeTruthy();
  });

  it("uses cardless first-level modules and one academic-position edit entry", async () => {
    renderCard();

    const card = screen.getByTestId("scholar-achievements-card");
    const positions = await screen.findByTestId("scholar-academic-positions-module");
    expect(card.className).not.toContain("rounded-xl");
    expect(card.className).not.toContain("shadow-sm");
    expect(positions.className).not.toContain("rounded-lg");
    expect(screen.getAllByRole("button", { name: "编辑学术兼职" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "批量识别学术兼职" })).toBeNull();
    expect(screen.queryByRole("button", { name: "新增学术兼职" })).toBeNull();
  });

  it("does not repeat the active tab label as a section subtitle", async () => {
    renderCard();

    expect(screen.queryByRole("heading", { name: "代表性论文" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /科研项目/ }));
    await screen.findByText("独立科研项目");
    expect(screen.queryByRole("heading", { name: "科研项目" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /开源项目/ }));
    await screen.findByText("Scholar Toolkit");
    expect(screen.queryByRole("heading", { name: "开源项目" })).toBeNull();
  });

  it("places the relation module inside scholar achievements before tabs", () => {
    renderCard(<div data-testid="relation-module">共建关系分类</div>);

    const card = screen.getByTestId("scholar-achievements-card");
    const relationModule = screen.getByTestId("relation-module");
    const tabs = screen.getByTestId("scholar-achievement-tabs");

    expect(card.contains(relationModule)).toBe(true);
    expect(relationModule.compareDocumentPosition(tabs)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("shows collection errors explicitly and allows retry", async () => {
    mocks.fetchOpenSourceProjects
      .mockRejectedValueOnce(new Error("开源项目接口不可用"))
      .mockResolvedValueOnce([]);
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /开源项目/ }));
    expect(await screen.findByText("开源项目接口不可用")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "重试开源项目" }));

    await waitFor(() => expect(mocks.fetchOpenSourceProjects).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("暂无开源项目数据")).toBeTruthy();
  });

  it("creates and refreshes only the active independent collection", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /科研项目/ }));
    await screen.findByText("独立科研项目");
    fireEvent.click(screen.getByRole("button", { name: "新增科研项目" }));

    fireEvent.change(screen.getByLabelText("项目名称 *"), {
      target: { value: "新建科研项目" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(mocks.createResearchProject).toHaveBeenCalledWith(
        "scholar-1",
        expect.objectContaining({ name: "新建科研项目" }),
      ),
    );
    await waitFor(() => expect(mocks.fetchResearchProjects).toHaveBeenCalledTimes(2));
    expect(mocks.fetchOpenSourceProjects).toHaveBeenCalledTimes(1);
    expect(mocks.fetchAcademicPositions).toHaveBeenCalledTimes(1);
  });

  it("presents open-source projects as ranked assets without per-item editing", async () => {
    mocks.fetchOpenSourceProjects.mockResolvedValue([
      {
        id: "oss-low",
        name: "Small Agent",
        repository_url: "https://github.com/example/small-agent",
        platform: "GitHub",
        language: "Python",
        role: "coauthor",
        stars: 8,
        forks: 2,
        description: "A compact agent experiment.",
      },
      {
        id: "oss-high",
        name: "Flagship Toolkit",
        repository_url: "https://github.com/example/flagship",
        platform: "GitHub",
        language: "TypeScript",
        role: "author",
        stars: 1200,
        forks: 84,
        description: "A production-ready research toolkit.",
      },
    ]);

    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /开源项目/ }));

    const high = await screen.findByText("Flagship Toolkit");
    const low = await screen.findByText("Small Agent");
    expect(high.compareDocumentPosition(low)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText("1,200")).toBeTruthy();
    expect(screen.getAllByText("Stars").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "编辑开源项目：Flagship Toolkit" })).toBeNull();
    expect(screen.getByRole("button", { name: "删除开源项目：Flagship Toolkit" })).toBeTruthy();
  });

  it("edits and deletes an independent resource", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /科研项目/ }));
    await screen.findByText("独立科研项目");

    fireEvent.click(
      screen.getByRole("button", { name: "编辑科研项目：独立科研项目" }),
    );
    fireEvent.change(screen.getByLabelText("项目名称 *"), {
      target: { value: "更新后的科研项目" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(mocks.updateResearchProject).toHaveBeenCalledWith(
        "scholar-1",
        "research-1",
        expect.objectContaining({ name: "更新后的科研项目" }),
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "删除科研项目：独立科研项目" }),
    );
    await waitFor(() =>
      expect(mocks.deleteResearchProject).toHaveBeenCalledWith(
        "scholar-1",
        "research-1",
      ),
    );
  });
});
