import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScholarDetail } from "@/services/scholarApi";
import { DetailLeftSidebar } from "./DetailLeftSidebar";

const scholar = {
  url_hash: "scholar-1",
  name: "测试学者",
  name_en: "Test Scholar",
  academic_titles: [],
  education: [],
  research_areas: [],
  joint_management_roles: [
    {
      role: "研究科学家",
      organization: "示例研究院",
      start_year: "2021",
      end_year: "2024",
    },
  ],
  custom_fields: {},
} as unknown as ScholarDetail;

describe("DetailLeftSidebar", () => {
  it("labels legacy management roles as employment history", () => {
    render(<DetailLeftSidebar scholar={scholar} />);

    expect(screen.getByText("任职经历")).toBeTruthy();
    expect(screen.queryByText("学术兼职")).toBeNull();
    expect(screen.getByText("研究科学家")).toBeTruthy();
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
});
