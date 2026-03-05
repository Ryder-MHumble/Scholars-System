// Firecrawl and DeepSeek integration for scholar scraping

const FIRECRAWL_API_KEY = "fc-2bca6bb78f984a78abac15f709490257";
const OPENROUTER_API_KEY = "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";
const DEEPSEEK_MODEL = "deepseek/deepseek-chat";

export interface ScrapedScholarData {
  name?: string;
  nameEn?: string;
  title?: string;
  email?: string;
  phone?: string;
  homepage?: string;
  researchFields?: string[];
  bio?: string;
  education?: Array<{
    degree: string;
    institution: string;
    year?: number;
  }>;
  publications?: Array<{
    title: string;
    year?: number;
    venue?: string;
  }>;
  honors?: string[];
}

export interface ScrapeProgress {
  stage: "fetching" | "extracting" | "completed" | "error";
  message: string;
  progress: number; // 0-100
}

/**
 * Scrape webpage content using Firecrawl
 */
async function scrapeWithFirecrawl(url: string): Promise<string> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Firecrawl error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return data.markdown || data.html || "";
}

/**
 * Extract scholar information using DeepSeek via OpenRouter
 */
async function extractWithDeepSeek(
  content: string,
  scholarName: string,
  institution: string
): Promise<ScrapedScholarData> {
  const prompt = `你是一个学术信息提取专家。请从以下网页内容中提取学者的详细信息。

学者姓名: ${scholarName}
所属机构: ${institution}

网页内容:
${content.substring(0, 8000)}

请提取以下信息（如果网页中没有相关信息，对应字段留空）:
1. 中文姓名
2. 英文姓名
3. 职称（教授、副教授、助理教授等）
4. 电子邮箱
5. 联系电话
6. 个人主页链接
7. 研究方向/研究领域（列表形式）
8. 个人简介
9. 教育背景（学位、院校、年份）
10. 代表性论文（标题、年份、发表venue）
11. 学术荣誉/奖项

请以JSON格式返回，格式如下:
{
  "name": "中文姓名",
  "nameEn": "English Name",
  "title": "职称",
  "email": "email@example.edu",
  "phone": "联系电话",
  "homepage": "个人主页URL",
  "researchFields": ["研究方向1", "研究方向2"],
  "bio": "个人简介",
  "education": [
    {"degree": "博士", "institution": "院校名称", "year": 2020}
  ],
  "publications": [
    {"title": "论文标题", "year": 2023, "venue": "会议/期刊名"}
  ],
  "honors": ["荣誉1", "荣誉2"]
}

只返回JSON，不要包含任何其他文字说明。`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "ScholarDB System",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DeepSeek error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const content_text = data.choices[0]?.message?.content || "{}";

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = content_text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?$/g, "");
  }

  try {
    const extracted = JSON.parse(jsonText);
    return extracted;
  } catch (err) {
    console.error("Failed to parse DeepSeek response:", jsonText);
    throw new Error("无法解析提取的学者信息");
  }
}

/**
 * Main function to scrape scholar information
 */
export async function scrapeScholarInfo(
  url: string,
  scholarName: string,
  institution: string,
  onProgress?: (progress: ScrapeProgress) => void
): Promise<ScrapedScholarData> {
  try {
    // Stage 1: Fetch webpage content
    onProgress?.({
      stage: "fetching",
      message: "正在获取网页内容...",
      progress: 20,
    });

    const content = await scrapeWithFirecrawl(url);

    if (!content || content.length < 100) {
      throw new Error("网页内容为空或过短，请检查URL是否正确");
    }

    // Stage 2: Extract information with AI
    onProgress?.({
      stage: "extracting",
      message: "正在使用 AI 提取学者信息...",
      progress: 60,
    });

    const scholarData = await extractWithDeepSeek(content, scholarName, institution);

    // Stage 3: Completed
    onProgress?.({
      stage: "completed",
      message: "信息提取完成！",
      progress: 100,
    });

    return scholarData;
  } catch (error) {
    onProgress?.({
      stage: "error",
      message: error instanceof Error ? error.message : "爬取失败",
      progress: 0,
    });
    throw error;
  }
}

/**
 * Validate URL format
 */
export function validateScholarUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);

    // Check if it's a valid HTTP/HTTPS URL
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "URL 必须以 http:// 或 https:// 开头" };
    }

    // Check if it's not a common non-scholar page
    const invalidPatterns = [
      /\.(pdf|doc|docx|ppt|pptx|zip|rar)$/i,
      /\/login/i,
      /\/signin/i,
      /\/register/i,
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(url)) {
        return { valid: false, error: "URL 似乎不是学者个人主页" };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "无效的 URL 格式" };
  }
}
