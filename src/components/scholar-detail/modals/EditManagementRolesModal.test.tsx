import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditManagementRolesModal } from "./EditManagementRolesModal";

describe("EditManagementRolesModal", () => {
  it("supports append-and-deduplicate batch import with a preview", () => {
    const onSubmit = vi.fn();
    render(
      <EditManagementRolesModal
        roles={[{ organization: "中国人工智能学会", role: "会士" }]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量导入" }));
    fireEvent.change(screen.getByRole("textbox", { name: "批量导入学术兼职" }), {
      target: {
        value:
          "中国人工智能学会 | 会士 | 2020 | 至今\n职务：期刊编委；机构：IEEE TCC",
      },
    });

    expect(screen.getByText("已识别 2 条")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "应用识别结果" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(onSubmit).toHaveBeenCalledWith([
      expect.objectContaining({
        organization: "中国人工智能学会",
        role: "会士",
        start_year: "2020",
        end_year: "至今",
      }),
      expect.objectContaining({ organization: "IEEE TCC", role: "期刊编委" }),
    ]);
  });
});
