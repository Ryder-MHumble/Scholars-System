import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";
import { createActivity } from "@/services/activityApi";
import type { ActivityCreateRequest } from "@/services/activityApi";
import { getCategoryByType } from "@/constants/activityCategories";

interface ActivityBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Partial<ActivityCreateRequest>;
  }>;
}

export function ActivityBatchImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ActivityBatchImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      // Simple CSV parser (handles quoted fields)
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const importResult: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      // Skip header row
      const dataRows = rows.slice(1);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed

        try {
          // CSV format: 活动类型,活动系列,系列编号,活动标题,摘要,主讲人姓名,主讲人单位,主讲人职务,主讲人简介,主讲人照片,活动日期,时长,地点,宣传方式,需要邮件邀请,证书编号,录入人
          const [
            eventType,
            series,
            seriesNumber,
            title,
            abstract,
            speakerName,
            speakerOrg,
            speakerPosition,
            speakerBio,
            speakerPhoto,
            eventDate,
            duration,
            location,
            publicity,
            needsEmail,
            certificateNumber,
            createdBy,
          ] = row;

          // Validate required fields
          if (!eventType?.trim()) {
            throw new Error("活动类型不能为空");
          }
          if (!title?.trim()) {
            throw new Error("活动标题不能为空");
          }
          if (!speakerName?.trim()) {
            throw new Error("主讲人姓名不能为空");
          }
          if (!speakerOrg?.trim()) {
            throw new Error("主讲人单位不能为空");
          }
          if (!eventDate?.trim()) {
            throw new Error("活动日期不能为空");
          }
          if (!location?.trim()) {
            throw new Error("活动地点不能为空");
          }

          // Get category from event type
          const categoryInfo = getCategoryByType(eventType.trim());
          if (!categoryInfo) {
            throw new Error(`未找到活动类型"${eventType}"对应的分类`);
          }

          const activityData: ActivityCreateRequest = {
            category: categoryInfo.categoryId,
            event_type: eventType.trim(),
            series: series?.trim() || undefined,
            series_number: seriesNumber?.trim() || undefined,
            title: title.trim(),
            abstract: abstract?.trim() || undefined,
            speaker_name: speakerName.trim(),
            speaker_organization: speakerOrg.trim(),
            speaker_position: speakerPosition?.trim() || undefined,
            speaker_bio: speakerBio?.trim() || undefined,
            speaker_photo_url: speakerPhoto?.trim() || undefined,
            event_date: eventDate.trim(),
            duration: duration ? parseFloat(duration) : 1,
            location: location.trim(),
            publicity: publicity?.trim() || undefined,
            needs_email_invitation:
              needsEmail?.toLowerCase() === "是" ||
              needsEmail?.toLowerCase() === "true",
            certificate_number: certificateNumber?.trim() || undefined,
            created_by: createdBy?.trim() || undefined,
            audit_status: "pending",
          };

          await createActivity(activityData);
          importResult.success++;
        } catch (error) {
          importResult.failed++;
          importResult.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : "未知错误",
          });
        }
      }

      setResult(importResult);
      if (importResult.success > 0) {
        onSuccess();
      }
    } catch (error) {
      importResult.failed++;
      importResult.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : "文件解析失败",
      });
      setResult(importResult);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `活动类型,活动系列,系列编号,活动标题,摘要,主讲人姓名,主讲人单位,主讲人职务,主讲人简介,主讲人照片,活动日期,时长,地点,宣传方式,需要邮件邀请,证书编号,录入人
学科前沿讲座,XAI智汇讲坛,42,人工智能前沿技术探讨,探讨最新的AI技术发展趋势,张三,清华大学,教授,人工智能领域专家,zhang-san.jpg,2024-03-15T14:00,2,清华大学主楼,可摄影摄像,是,XAI-D2642-001,管理员`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "活动导入模板.csv";
    link.click();
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-gray-900">批量导入活动</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    下载导入模板
                  </h3>
                  <p className="text-xs text-blue-700 mb-3">
                    请先下载CSV模板，按照模板格式填写活动信息后上传
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载模板
                  </button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择CSV文件
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  {file ? file.name : "点击选择文件或拖拽文件到此处"}
                </p>
                <p className="text-xs text-gray-400">
                  支持CSV格式，文件大小不超过10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Import Result */}
            {result && (
              <div className="space-y-3">
                {result.success > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        成功导入 {result.success} 条活动
                      </span>
                    </div>
                  </div>
                )}

                {result.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 mb-2">
                          失败 {result.failed} 条
                        </p>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {result.errors.map((err, idx) => (
                            <p key={idx} className="text-xs text-red-700">
                              第 {err.row} 行: {err.error}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={importing}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {result ? "关闭" : "取消"}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? "导入中..." : "开始导入"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
