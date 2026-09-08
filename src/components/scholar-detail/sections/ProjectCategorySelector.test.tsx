import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectCategorySelector } from "./ProjectCategorySelector";

describe("ProjectCategorySelector", () => {
  it("keeps only the heading, edit icon, and project tags in its read view", () => {
    render(
      <ProjectCategorySelector
        projectTags={[
          {
            category: "科研学术",
            subcategory: "科研立项",
          },
        ]}
        onSave={vi.fn()}
        variant="embedded"
      />,
    );

    expect(screen.getByRole("heading", { name: "共建关系分类" })).toBeTruthy();
    expect(screen.getByText("科研学术 / 科研立项")).toBeTruthy();
    expect(screen.queryByText("共建导师")).toBeNull();
    expect(screen.queryByText("未建立关系")).toBeNull();
    expect(
      screen.queryByText("学者与两院关系仅由项目分类定义，任一项目分类非空即视为共建导师。"),
    ).toBeNull();

    const editButton = screen.getByRole("button", { name: "编辑共建关系分类" });
    expect(editButton.textContent).toBe("");
    fireEvent.click(editButton);
    expect(screen.getByText("一级分类")).toBeTruthy();
    expect(screen.getByText("二级分类")).toBeTruthy();
  });
});
