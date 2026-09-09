import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScholarDetail } from "@/services/scholarApi";
import { EditProfileModal } from "./EditProfileModal";

const scholar = {
  url_hash: "scholar-1",
  name: "测试学者",
  university: "上海交通大学",
  department: "人工智能学院",
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
      end_date: null,
      is_current: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  joint_management_roles: [
    { organization: "示例人工智能学会", role: "理事" },
  ],
} as unknown as ScholarDetail;

describe("EditProfileModal employment history", () => {
  it("edits normalized employment history instead of academic adjuncts", () => {
    render(
      <EditProfileModal
        scholar={scholar}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "任职经历" }));

    expect(screen.getByDisplayValue("研究科学家")).toBeTruthy();
    expect(screen.getByDisplayValue("示例科技公司")).toBeTruthy();
    expect(screen.queryByDisplayValue("示例人工智能学会")).toBeNull();
  });
});
