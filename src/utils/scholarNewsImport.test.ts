import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  parseNewsRows,
  parseNewsRowsFromText,
  prepareNewsImportRows,
} from "./scholarNewsImport";

function workbookFromRows(rows: unknown[][]): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(rows),
    "学者News",
  );
  return workbook;
}

describe("parseNewsRows", () => {
  it("parses Chinese headers, UTF-8 values, blank rows, and Excel dates", () => {
    const workbook = workbookFromRows([
      ["学者ID", "姓名", "机构", "标题", "类型", "摘要", "正文", "发布日期", "来源URL"],
      [
        "scholar-1",
        "张三",
        "北京中关村学院",
        "获批重点项目",
        "科研动态",
        "项目摘要",
        "项目正文",
        new Date(Date.UTC(2026, 8, 7)),
        "https://example.com/news/1",
      ],
      [null, null, null, null, null, null, null, null, null],
    ]);

    const result = parseNewsRows(workbook);

    expect(result.errors).toEqual([]);
    expect(result.rowNumbers).toEqual([2]);
    expect(result.rows[0]).toMatchObject({
      scholar_id: "scholar-1",
      title: "获批重点项目",
      news_type: "科研动态",
      summary: "项目摘要",
      content: "项目正文",
      published_at: "2026-09-07",
      source_url: "https://example.com/news/1",
      match_status: "matched",
      match_method: "scholar_id",
    });
  });

  it("accepts English headers and marks name plus institution for matching", () => {
    const workbook = workbookFromRows([
      [
        "Scholar ID",
        "Name",
        "Institution",
        "Title",
        "Type",
        "Summary",
        "Content",
        "Published At",
        "Source URL",
      ],
      ["", "Ada Lovelace", "Analytical Society", "New role", "Appointment", "", "", "2026/09/08", ""],
    ]);

    const result = parseNewsRows(workbook);

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      name: "Ada Lovelace",
      institution: "Analytical Society",
      title: "New role",
      published_at: "2026-09-08",
      match_status: "pending_match",
      match_method: "name_institution",
    });
  });

  it("converts numeric Excel date serials", () => {
    const excelSerial =
      (Date.UTC(2026, 8, 9) - Date.UTC(1899, 11, 30)) / 86_400_000;
    const workbook = workbookFromRows([
      ["学者ID", "标题", "发布日期"],
      ["scholar-1", "数字日期", excelSerial],
    ]);

    expect(parseNewsRows(workbook).rows[0].published_at).toBe("2026-09-09");
  });

  it("rejects duplicate rows and reports the original worksheet row", () => {
    const workbook = workbookFromRows([
      ["学者ID", "标题", "发布日期", "来源URL"],
      ["scholar-1", "Same news", "2026-09-07", "https://example.com/news"],
      ["scholar-1", " Same   news ", "2026-09-07", "https://example.com/news"],
    ]);

    const result = parseNewsRows(workbook);

    expect(result.rows).toHaveLength(1);
    expect(result.errors).toEqual([
      expect.objectContaining({ row: 3, error: expect.stringContaining("重复") }),
    ]);
  });

  it("returns row-numbered validation errors", () => {
    const workbook = workbookFromRows([
      ["姓名", "机构", "标题", "发布日期", "来源URL"],
      ["只有姓名", "", "", "not-a-date", "ftp://example.com/news"],
    ]);

    const result = parseNewsRows(workbook);

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      {
        row: 2,
        error: expect.stringMatching(/标题.*发布日期.*来源 URL.*姓名和机构/),
      },
    ]);
  });

  it("converts preview dates to timezone-aware API datetimes", () => {
    const rows = prepareNewsImportRows([
      {
        scholar_id: "scholar-1",
        title: "News",
        published_at: "2026-09-07",
      },
    ]);

    expect(rows[0].published_at).toBe("2026-09-07T00:00:00Z");
  });

  it("parses pasted scholar activity rows without Excel", () => {
    const result = parseNewsRowsFromText(
      [
        "论文接收 | 2026-09-08 | 论文动态 | 论文被 NeurIPS 接收 | https://example.com/a",
        "标题：获奖通知；日期：2026/09/09；类型：获奖；摘要：获得最佳论文奖；来源：https://example.com/b",
      ].join("\n"),
      "scholar-1",
    );

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      expect.objectContaining({
        scholar_id: "scholar-1",
        title: "论文接收",
        published_at: "2026-09-08",
        news_type: "论文动态",
        summary: "论文被 NeurIPS 接收",
        source_url: "https://example.com/a",
        match_status: "matched",
        match_method: "scholar_id",
        review_status: "approved",
      }),
      expect.objectContaining({
        scholar_id: "scholar-1",
        title: "获奖通知",
        published_at: "2026-09-09",
        news_type: "获奖",
        summary: "获得最佳论文奖",
        source_url: "https://example.com/b",
      }),
    ]);
    expect(result.rowNumbers).toEqual([1, 2]);
  });
});
