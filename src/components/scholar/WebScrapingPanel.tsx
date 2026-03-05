import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  scrapeScholarInfo,
  validateScholarUrl,
  type ScrapedScholarData,
  type ScrapeProgress,
} from "@/utils/scholarScraper";

interface WebScrapingPanelProps {
  onCancel: () => void;
  onSuccess: (data: Partial<ScrapedScholarData>) => void;
}

export function WebScrapingPanel({ onCancel, onSuccess }: WebScrapingPanelProps) {
  const [scholarName, setScholarName] = useState("");
  const [institution, setInstitution] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedScholarData | null>(null);
  const [error, setError] = useState("");

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError("");
  };

  const handleScrape = async () => {
    // Validate inputs
    if (!scholarName.trim()) {
      setError("请输入学者姓名");
      return;
    }
    if (!institution.trim()) {
      setError("请输入所属机构");
      return;
    }
    if (!url.trim()) {
      setError("请输入个人主页 URL");
      return;
    }

    // Validate URL
    const validation = validateScholarUrl(url);
    if (!validation.valid) {
      setUrlError(validation.error || "无效的 URL");
      return;
    }

    setError("");
    setScrapedData(null);

    try {
      const data = await scrapeScholarInfo(
        url,
        scholarName,
        institution,
        setProgress
      );
      setScrapedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "爬取失败");
      setProgress(null);
    }
  };

  const handleUseData = () => {
    if (scrapedData) {
      onSuccess(scrapedData);
    }
  };

  const isProcessing = progress && progress.stage !== "completed" && progress.stage !== "error";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-8"
      >
        <div className="text-center mb-6">
          <Globe className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            网页爬取学者信息
          </h2>
          <p className="text-sm text-gray-500">
            输入学者的个人主页 URL，系统将使用 AI 自动提取学者信息
          </p>
        </div>

        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2 font-medium">
              🤖 AI 智能提取
            </p>
            <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
              <li>使用 Firecrawl 获取网页内容，DeepSeek V3 提取结构化信息</li>
              <li>支持学者个人主页、Google Scholar、院系主页等</li>
              <li>提取完成后可以预览和编辑信息再保存</li>
              <li>系统会自动检测该学者是否已存在于数据库中</li>
            </ul>
          </div>

          {/* Input Fields */}
          {!scrapedData && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学者姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={scholarName}
                  onChange={(e) => setScholarName(e.target.value)}
                  placeholder="请输入学者姓名"
                  disabled={!!isProcessing}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属机构 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="例如：清华大学"
                  disabled={!!isProcessing}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人主页 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.edu.cn/~scholar"
                  disabled={!!isProcessing}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    urlError
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200 focus:ring-blue-500"
                  }`}
                />
                {urlError && (
                  <p className="mt-1 text-xs text-red-600">{urlError}</p>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {progress.stage === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                ) : progress.stage === "error" ? (
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {progress.message}
                  </p>
                  {progress.stage !== "completed" && progress.stage !== "error" && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Scraped Data Preview */}
          {scrapedData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-sm font-medium text-gray-900">
                  提取成功！请确认信息
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {scrapedData.name && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">姓名</p>
                    <p className="text-sm text-gray-900">{scrapedData.name}</p>
                  </div>
                )}
                {scrapedData.nameEn && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">英文姓名</p>
                    <p className="text-sm text-gray-900">{scrapedData.nameEn}</p>
                  </div>
                )}
                {scrapedData.title && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">职称</p>
                    <p className="text-sm text-gray-900">{scrapedData.title}</p>
                  </div>
                )}
                {scrapedData.email && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">邮箱</p>
                    <p className="text-sm text-gray-900">{scrapedData.email}</p>
                  </div>
                )}
                {scrapedData.researchFields && scrapedData.researchFields.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">研究方向</p>
                    <div className="flex flex-wrap gap-1">
                      {scrapedData.researchFields.map((field, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {scrapedData.bio && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">个人简介</p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {scrapedData.bio}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  💡 提示：点击"使用此数据"后，您可以在表单中继续编辑和完善信息
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={onCancel}
              disabled={!!isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scrapedData ? "放弃" : "取消"}
            </button>
            {!scrapedData ? (
              <button
                onClick={handleScrape}
                disabled={!!isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {isProcessing ? "爬取中..." : "开始爬取"}
              </button>
            ) : (
              <button
                onClick={handleUseData}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                使用此数据
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
