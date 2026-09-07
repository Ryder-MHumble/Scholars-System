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

function renderCard() {
  return render(
    <MemoryRouter>
      <AchievementsDetailCard scholar={scholar} onShowAchievementsModal={vi.fn()} />
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
    mocks.updateResearchProject.mockResolvedValue({ id: "research-1" });
    mocks.updateOpenSourceProject.mockResolvedValue({ id: "oss-1" });
    mocks.updateAcademicPosition.mockResolvedValue({ id: "position-1" });
  });

  it("renders six independent achievement tabs and resource records", async () => {
    renderCard();

    expect(screen.getByText("学者成就")).toBeTruthy();
    for (const label of [
      "代表论文",
      "专利",
      "获奖",
      "科研项目",
      "开源项目",
      "学术兼职",
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

    fireEvent.click(screen.getByRole("button", { name: /学术兼职/ }));
    expect(await screen.findByText("中国计算机学会")).toBeTruthy();
    expect(screen.getByText("当前任职")).toBeTruthy();
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
