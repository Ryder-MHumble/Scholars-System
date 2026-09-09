import { describe, expect, it } from "vitest";
import {
  parseAcademicPositionsFromText,
  parseManagementRolesFromText,
  parseOpenSourceProjectsFromText,
} from "./textParsers";

describe("parseAcademicPositionsFromText", () => {
  it("parses pasted academic positions with organization-first and labeled formats", () => {
    const rows = parseAcademicPositionsFromText(
      [
        "武汉大学人工智能学院 | 兼职导师 | 2024-01 | 至今",
        "职务：顾问委员会委员；机构：北京中关村学院；开始：2025-09-01；结束：2026-09-01；类型：委员会；描述：参与学术咨询",
      ].join("\n"),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        organization: "武汉大学人工智能学院",
        title: "兼职导师",
        start_date: "2024-01-01",
        end_date: null,
        is_current: true,
      }),
      expect.objectContaining({
        organization: "北京中关村学院",
        title: "顾问委员会委员",
        position_type: "委员会",
        start_date: "2025-09-01",
        end_date: "2026-09-01",
        is_current: false,
        description: "参与学术咨询",
      }),
    ]);
  });

  it("parses date-first employment history with organization and department", () => {
    expect(
      parseAcademicPositionsFromText(
        [
          "2021-至今  上海交通大学  人工智能学院  教授",
          "2017-2021  北京大学  计算机学院  副教授",
        ].join("\n"),
      ),
    ).toEqual([
      expect.objectContaining({
        organization: "上海交通大学",
        department: "人工智能学院",
        title: "教授",
        start_date: "2021-01-01",
        end_date: null,
        is_current: true,
      }),
      expect.objectContaining({
        organization: "北京大学",
        department: "计算机学院",
        title: "副教授",
        start_date: "2017-01-01",
        end_date: "2021-01-01",
        is_current: false,
      }),
    ]);
  });
});

describe("parseManagementRolesFromText", () => {
  it("splits multiple academic adjuncts and keeps them out of employment records", () => {
    expect(
      parseManagementRolesFromText(
        "天津市人工智能学会理事长，城市智能与数字治理教育部工程研究中心主任",
      ),
    ).toEqual([
      expect.objectContaining({
        organization: "天津市人工智能学会",
        role: "理事长",
      }),
      expect.objectContaining({
        organization: "城市智能与数字治理教育部工程研究中心",
        role: "主任",
      }),
    ]);
  });
});

describe("parseOpenSourceProjectsFromText", () => {
  it("parses pasted open-source projects from a pipe-delimited row", () => {
    expect(
      parseOpenSourceProjectsFromText(
        "Scholar Toolkit | https://github.com/example/toolkit | TypeScript | 128 | 9 | GitHub",
      ),
    ).toEqual([
      expect.objectContaining({
        name: "Scholar Toolkit",
        repository_url: "https://github.com/example/toolkit",
        language: "TypeScript",
        stars: 128,
        forks: 9,
        platform: "GitHub",
      }),
    ]);
  });
});
