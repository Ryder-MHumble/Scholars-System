import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { ScholarDetail } from "@/services/scholarApi";
import { AchievementsDetailCard } from "./AchievementsDetailCard";

const mocks = vi.hoisted(() => ({
  fetchResearchProjects: vi.fn(),
  fetchOpenSourceProjects: vi.fn(),
  createResearchProject: vi.fn(),
  createOpenSourceProject: vi.fn(),
  batchOpenSourceProjects: vi.fn(),
  updateResearchProject: vi.fn(),
  updateOpenSourceProject: vi.fn(),
  deleteResearchProject: vi.fn(),
  deleteOpenSourceProject: vi.fn(),
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
  joint_management_roles: [
    { organization: "中国计算机学会", role: "高级会员" },
    { organization: "IEEE TCC", role: "期刊编委" },
  ],
} as unknown as ScholarDetail;

function renderCard(
  relationSlot?: React.ReactNode,
  onShowAchievementsModal = vi.fn(),
  onSaveManagementRoles = vi.fn(),
) {
  return render(
    <MemoryRouter>
      <AchievementsDetailCard
        scholar={scholar}
        onShowAchievementsModal={onShowAchievementsModal}
        onSaveManagementRoles={onSaveManagementRoles}
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
    mocks.createResearchProject.mockResolvedValue({ id: "research-new" });
    mocks.createOpenSourceProject.mockResolvedValue({ id: "oss-new" });
    mocks.batchOpenSourceProjects.mockResolvedValue({
      total: 1,
      created: 1,
      updated: 0,
      skipped: 0,
      pending_match: 0,
      failed: 0,
      rows: [{ row: 1, status: "created", item_id: "oss-2", error: "" }],
    });
    mocks.updateResearchProject.mockResolvedValue({ id: "research-1" });
    mocks.updateOpenSourceProject.mockResolvedValue({ id: "oss-1" });
  });

  it("renders academic adjuncts as visible tags instead of an achievement tab", async () => {
    renderCard();

    expect(screen.getByText("学术成果")).toBeTruthy();
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
    const adjunctModule = screen.getByTestId("scholar-academic-adjuncts-module");
    expect(adjunctModule.textContent).toContain("中国计算机学会 · 高级会员");
    expect(adjunctModule.textContent).toContain("IEEE TCC · 期刊编委");
    expect(screen.queryByRole("button", { name: /展开学术兼职|收起学术兼职/ })).toBeNull();
  });

  it("uses cardless first-level modules and matching section headings", () => {
    renderCard();

    const card = screen.getByTestId("scholar-achievements-card");
    const adjuncts = screen.getByTestId("scholar-academic-adjuncts-module");
    const adjunctHeading = screen.getByRole("heading", { name: "学术兼职" });
    const achievementHeading = screen.getByRole("heading", { name: "学术成果" });
    expect(card.className).not.toContain("rounded-xl");
    expect(card.className).not.toContain("shadow-sm");
    expect(adjuncts.className).not.toContain("rounded-lg");
    expect(adjunctHeading.className).toContain("text-lg");
    expect(achievementHeading.className).toContain("text-lg");
    expect(screen.getAllByRole("button", { name: "编辑学术兼职" })).toHaveLength(1);
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

  it("places the sole achievement editor beside the academic outcomes heading", async () => {
    const onShowAchievementsModal = vi.fn();
    renderCard(undefined, onShowAchievementsModal);

    const adjuncts = screen.getByTestId("scholar-academic-adjuncts-module");
    const heading = screen.getByRole("heading", { name: "学术成果" });
    const tabs = screen.getByTestId("scholar-achievement-tabs");

    expect(screen.queryByText("学者成就")).toBeNull();
    expect(adjuncts.compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(heading.compareDocumentPosition(tabs)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getAllByRole("button", { name: "编辑学术成果" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "编辑学术成果" }));
    expect(onShowAchievementsModal).toHaveBeenCalledOnce();
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
