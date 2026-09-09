import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditAchievementsModal } from "./EditAchievementsModal";

describe("EditAchievementsModal", () => {
  it("submits pasted open-source projects and academic positions with the bulk edit", async () => {
    const onSubmitResources = vi.fn().mockResolvedValue(undefined);
    render(
      <EditAchievementsModal
        publications={[]}
        patents={[]}
        awards={[]}
        projects={[]}
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onSubmitResources={onSubmitResources}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量识别" }));
    fireEvent.change(screen.getByLabelText("开源项目批量识别"), {
      target: { value: "Scholar Toolkit | https://github.com/example/toolkit | TypeScript | 128 | 9 | GitHub" },
    });
    fireEvent.change(screen.getByLabelText("学术兼职批量识别"), {
      target: { value: "武汉大学人工智能学院 | 兼职导师 | 2024-01 | 至今" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存全部" }));

    await waitFor(() => expect(onSubmitResources).toHaveBeenCalledWith({
      openSourceProjects: [expect.objectContaining({ name: "Scholar Toolkit" })],
      academicPositions: [expect.objectContaining({ organization: "武汉大学人工智能学院", title: "兼职导师" })],
    }));
  });
});
