import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ScholarDetailPage from "./ScholarDetailPage";

vi.mock("@/hooks/useScholarDetail", () => ({
  useScholarDetail: () => ({
    scholar: {
      url_hash: "scholar-1",
      name: "测试学者",
      project_tags: [],
      joint_research_projects: [],
    },
    isLoading: false,
    error: null,
    editableAchievements: null,
    handleFieldSave: vi.fn(),
    handleManagementRolesSave: vi.fn(),
    handleAchievementsSave: vi.fn(),
    handleProjectCategorySave: vi.fn(),
  }),
}));

vi.mock("@/components/scholar-detail/sections/DetailLeftSidebar", () => ({
  DetailLeftSidebar: () => <div>left-sidebar</div>,
}));

vi.mock("@/components/scholar-detail/sections/ProjectCategorySelector", () => ({
  ProjectCategorySelector: () => <div>project-categories</div>,
}));

vi.mock("@/components/scholar-detail/sections/AchievementsDetailCard", () => ({
  AchievementsDetailCard: () => <div>achievements</div>,
}));

vi.mock("@/components/scholar-detail/sections/RightSidebar", () => ({
  RightSidebar: () => <div>right-sidebar</div>,
}));

describe("ScholarDetailPage responsive layout", () => {
  it("stacks all detail regions on small screens and restores columns at xl", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/scholars/scholar-1"]}>
        <Routes>
          <Route path="/scholars/:scholarId" element={<ScholarDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const page = container.querySelector("[data-testid='scholar-detail-page']");
    const layout = container.querySelector("[data-testid='scholar-detail-layout']");
    const left = screen.getByText("left-sidebar").parentElement;
    const main = screen.getByRole("main");
    const right = screen.getByText("right-sidebar").parentElement;

    expect(page?.className).toContain("min-h-screen");
    expect(page?.className).toContain("xl:h-screen");
    expect(layout?.className).toContain("flex-col");
    expect(layout?.className).toContain("xl:flex-row");
    expect(left?.className).toContain("w-full");
    expect(left?.className).toContain("xl:w-[400px]");
    expect(main.className).toContain("w-full");
    expect(main.className).toContain("xl:overflow-y-auto");
    expect(right?.className).toContain("w-full");
    expect(right?.className).toContain("xl:w-80");
  });
});
