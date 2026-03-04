import type { AcademicTitle, AcademicHonor } from "@/types";

export const ALL_TITLES: AcademicTitle[] = [
  "教授",
  "副教授",
  "助理教授",
  "研究员",
  "副研究员",
  "助理研究员",
  "讲师",
  "博士后",
];

export const ALL_HONORS: AcademicHonor[] = [
  "中国科学院院士",
  "中国工程院院士",
  "国家杰出青年科学基金获得者",
  "国家优秀青年科学基金获得者",
  "长江学者特聘教授",
  "长江学者青年学者",
  "万人计划领军人才",
  "IEEE Fellow",
  "ACM Fellow",
];

export const SCHOLAR_DIVISIONS = [
  "AI核心和基础/AI安全",
  "AI社会科学",
  "AI+自然科学/生命科学",
  "AI核心和基础/大模型",
  "AI+工程技术",
  "其他",
] as const;
