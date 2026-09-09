import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScholarDetail } from "@/services/scholarApi";
import { DetailLeftSidebar } from "./DetailLeftSidebar";

const scholar = {
  url_hash: "scholar-1",
  name: "测试学者",
  name_en: "Test Scholar",
  profile_url: "https://example.com/scholar",
  academic_titles: [],
  education: [],
  research_areas: [],
  academic_positions: [
    {
      id: "position-1",
      scholar_id: "scholar-id-1",
      organization: "示例科技公司",
      department: "人工智能研究院",
      title: "研究科学家",
      start_date: "2021-01-01",
      end_date: "2024-12-31",
      is_current: false,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  joint_management_roles: [
    {
      role: "理事",
      organization: "示例人工智能学会",
      start_year: "2021",
      end_year: "2024",
    },
  ],
  custom_fields: {},
} as unknown as ScholarDetail;

describe("DetailLeftSidebar", () => {
  it("renders normalized academic positions as employment history", () => {
    render(<DetailLeftSidebar scholar={scholar} />);

    expect(screen.getByText("任职经历")).toBeTruthy();
    expect(screen.queryByText("学术兼职")).toBeNull();
    expect(screen.getByText("研究科学家")).toBeTruthy();
    expect(screen.getByText(/示例科技公司/)).toBeTruthy();
    expect(screen.queryByText("示例人工智能学会")).toBeNull();
  });

  it("does not render the metric update caption", () => {
    render(
      <DetailLeftSidebar
        scholar={{ ...scholar, metrics_updated_at: "2026-09-09" }}
      />,
    );

    expect(screen.queryByText(/指标更新时间/)).toBeNull();
  });

  it("uses a compact icon button for profile editing", () => {
    const onEditProfile = vi.fn();
    render(
      <DetailLeftSidebar scholar={scholar} onEditProfile={onEditProfile} />,
    );

    const button = screen.getByRole("button", { name: "编辑基础信息" });
    expect(button.textContent).toBe("");
    fireEvent.click(button);
    expect(onEditProfile).toHaveBeenCalledOnce();
  });

  it("renders profile link tooltips outside the sidebar clipping boundary", () => {
    const { container } = render(<DetailLeftSidebar scholar={scholar} />);

    const sidebarContent = container.querySelector("aside > div");
    const homepageLink = screen.getByRole("link", { name: "个人主页" });
    expect(sidebarContent?.className).not.toContain("overflow-hidden");

    fireEvent.mouseEnter(homepageLink);

    const tooltip = screen.getByRole("tooltip", { name: "个人主页" });
    expect(tooltip.parentElement).toBe(document.body);
  });
});
