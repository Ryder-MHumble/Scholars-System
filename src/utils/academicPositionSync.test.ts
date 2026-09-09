import { describe, expect, it } from "vitest";
import type { AcademicPosition } from "@/services/scholarApi";
import { buildAcademicPositionSyncPlan } from "./academicPositionSync";

const existing = [
  {
    id: "position-1",
    scholar_id: "scholar-1",
    organization: "旧单位",
    department: null,
    title: "研究员",
    start_date: "2020-01-01",
    end_date: null,
    is_current: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "position-2",
    scholar_id: "scholar-1",
    organization: "待删除单位",
    department: null,
    title: "工程师",
    start_date: "2018-01-01",
    end_date: "2019-12-31",
    is_current: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
] satisfies AcademicPosition[];

describe("buildAcademicPositionSyncPlan", () => {
  it("separates creates, updates and removals without leaking record metadata", () => {
    const plan = buildAcademicPositionSyncPlan(existing, [
      { ...existing[0], organization: "新单位" },
      {
        organization: "新增单位",
        department: "研发部",
        title: "首席科学家",
        start_date: "2025",
        end_date: null,
        is_current: true,
      },
    ]);

    expect(plan.removeIds).toEqual(["position-2"]);
    expect(plan.updates).toEqual([
      {
        id: "position-1",
        payload: expect.objectContaining({
          organization: "新单位",
          title: "研究员",
        }),
      },
    ]);
    expect(plan.updates[0].payload).not.toHaveProperty("scholar_id");
    expect(plan.creates).toEqual([
      expect.objectContaining({
        organization: "新增单位",
        title: "首席科学家",
      }),
    ]);
  });
});
