import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  BookOpen,
  Award,
  BarChart2,
  Handshake,
  FileSpreadsheet,
  Globe,
  Edit3,
  Download,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { AcademicTitle, AcademicHonor } from "@/types";
import { FormSection } from "@/components/ui/FormSection";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { TextareaInput } from "@/components/ui/TextareaInput";
import { SelectInput } from "@/components/ui/SelectInput";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import { TagInput } from "@/components/common/TagInput";
import { SuccessOverlay } from "@/components/common/SuccessOverlay";
import { WebScrapingPanel } from "@/components/scholar/WebScrapingPanel";
import { useUniversityCounts } from "@/hooks/useUniversityCounts";
import {
  smartParseExcel,
  type SmartParseResult,
} from "@/utils/smartExcelParser";
import { downloadScholarTemplate } from "@/utils/scholarTemplateGenerator";
import {
  ALL_TITLES,
  ALL_HONORS,
  SCHOLAR_DIVISIONS,
} from "@/constants/scholarForm";
import { createScholar } from "@/services/scholarApi";

interface FormData {
  name: string;
  nameEn: string;
  title: AcademicTitle | "";
  universityId: string;
  departmentId: string;
  email: string;
  phone: string;
  homepage: string;
  googleScholar: string;
  dblp: string;
  researchFields: string[];
  honors: AcademicHonor[];
  bio: string;
  hIndex: string;
  citationCount: string;
  paperCount: string;
  scholarDivision: string;
  mentorType: "教学研究型" | "研究型" | "";
  talentPlans: string[];
}

const initialForm: FormData = {
  name: "",
  nameEn: "",
  title: "",
  universityId: "",
  departmentId: "",
  email: "",
  phone: "",
  homepage: "",
  googleScholar: "",
  dblp: "",
  researchFields: [],
  honors: [],
  bio: "",
  hIndex: "",
  citationCount: "",
  paperCount: "",
  scholarDivision: "",
  mentorType: "",
  talentPlans: [],
};

type TabType = "manual" | "excel" | "scrape";

export default function AddScholarPage() {
  const navigate = useNavigate();
  const { universities: uniData, loading: uniLoading } = useUniversityCounts();

  const universityOptions = useMemo(
    () =>
      uniData.map((uni) => ({
        name: uni.name,
        departments: Object.keys(uni.departments),
      })),
    [uniData],
  );

  const [activeTab, setActiveTab] = useState<TabType>("manual");
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Excel import state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelParseResult, setExcelParseResult] = useState<SmartParseResult<
    Record<string, unknown>
  > | null>(null);
  const [excelIsProcessing, setExcelIsProcessing] = useState(false);
  const [excelIsDragging, setExcelIsDragging] = useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedUni = useMemo(
    () => universityOptions.find((u) => u.name === form.universityId),
    [universityOptions, form.universityId],
  );

  const toggleHonor = (h: AcademicHonor) =>
    set(
      "honors",
      form.honors.includes(h)
        ? form.honors.filter((x) => x !== h)
        : [...form.honors, h],
    );

  const validate = () => {
    const errs: Partial<Record<keyof FormData, boolean>> = {};
    if (!form.name.trim()) errs.name = true;
    if (!form.title) errs.title = true;
    if (!form.universityId) errs.universityId = true;
    if (!form.departmentId) errs.departmentId = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createScholar({
        name: form.name,
        name_en: form.nameEn || undefined,
        position: form.title,
        university: form.universityId,
        department: form.departmentId,
        email: form.email || undefined,
        phone: form.phone || undefined,
        profile_url: form.homepage || undefined,
        dblp_url: form.dblp || undefined,
        google_scholar_url: form.googleScholar || undefined,
        research_areas:
          form.researchFields.length > 0 ? form.researchFields : undefined,
        bio: form.bio || undefined,
        added_by: "user",
      });

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create scholar",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excel import handlers
  const handleExcelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setExcelIsDragging(true);
  };

  const handleExcelDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setExcelIsDragging(false);
  };

  const handleExcelDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setExcelIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await handleExcelFileSelect(droppedFile);
    }
  };

  const handleExcelFileSelect = async (selectedFile: File) => {
    setExcelFile(selectedFile);
    setExcelIsProcessing(true);
    setExcelParseResult(null);

    try {
      const result = await smartParseExcel<Record<string, unknown>>(
        selectedFile,
        "scholar",
      );
      setExcelParseResult(result);
    } catch (err) {
      setExcelParseResult({
        data: [],
        detectedColumns: [],
        errors: [
          { row: 0, error: err instanceof Error ? err.message : "解析失败" },
        ],
        confidence: 0,
      });
    } finally {
      setExcelIsProcessing(false);
    }
  };

  const handleExcelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleExcelFileSelect(selectedFile);
    }
  };

  const handleExcelImport = () => {
    if (!excelParseResult || excelParseResult.data.length === 0) return;

    const row = excelParseResult.data[0] as Record<string, unknown>;

    // Map parsed data to form fields
    const mappedForm: FormData = {
      ...form,
      name: String(row.name || row.姓名 || "").trim(),
      nameEn: String(row.nameEn || row.name_en || row.英文名 || "").trim(),
      title: String(
        row.title || row.position || row.职称 || "",
      ) as AcademicTitle,
      universityId: String(
        row.university || row.institution || row.院校 || "",
      ).trim(),
      departmentId: String(row.department || row.院系 || "").trim(),
      email: String(row.email || row.邮箱 || "").trim(),
      phone: String(row.phone || row.电话 || "").trim(),
      homepage: String(
        row.homepage || row.profile_url || row.主页 || "",
      ).trim(),
      googleScholar: String(
        row.google_scholar || row.googleScholar || row.谷歌学术 || "",
      ).trim(),
      dblp: String(row.dblp || row.dblp_url || "").trim(),
      researchFields: String(
        row.researchFields || row.research_areas || row.研究方向 || "",
      )
        .split(/[,，、;；]/)
        .map((s: string) => s.trim())
        .filter(Boolean),
      bio: String(row.bio || row.简介 || "").trim(),
      hIndex: String(row.hIndex || row.h_index || ""),
      citationCount: String(row.citationCount || row.citation_count || ""),
      paperCount: String(row.paperCount || row.paper_count || ""),
      scholarDivision: "",
      mentorType: "",
      talentPlans: [],
      honors: [],
    };

    setForm(mappedForm);
    setExcelFile(null);
    setExcelParseResult(null);
    setActiveTab("manual");
  };

  const handleDownloadTemplate = () => {
    downloadScholarTemplate(undefined, "basic");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {submitted && (
        <SuccessOverlay onAction={() => navigate("/?tab=scholars")} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <h1 className="text-base font-bold text-gray-900">添加学者</h1>
              <p className="text-xs text-gray-400">
                {activeTab === "manual"
                  ? "填写学者基本信息与学术档案"
                  : activeTab === "excel"
                    ? "从 Excel 导入学者数据"
                    : "通过个人主页爬取学者信息"}
              </p>
            </div>
          </div>
          {activeTab === "manual" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm(initialForm)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重置
              </button>
              <button
                form="add-scholar-form"
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存学者"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="max-w-5xl mx-auto px-6 border-t border-gray-100">
          <div className="flex gap-1">
            {(
              [
                { id: "manual", label: "手动填写", icon: Edit3 },
                { id: "excel", label: "Excel导入", icon: FileSpreadsheet },
                { id: "scrape", label: "网页爬取", icon: Globe },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600 bg-primary-50/30"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      {activeTab === "manual" && (
        <form
          id="add-scholar-form"
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto px-6 py-8 space-y-5"
        >
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">创建学者失败</p>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* 基本信息 */}
            <FormSection icon={<User className="w-4 h-4" />} title="基本信息">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="姓名" required>
                  <TextInput
                    value={form.name}
                    onChange={(v) => set("name", v)}
                    placeholder="请输入学者姓名"
                    error={errors.name}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">姓名不能为空</p>
                  )}
                </Field>
                <Field label="英文姓名">
                  <TextInput
                    value={form.nameEn}
                    onChange={(v) => set("nameEn", v)}
                    placeholder="e.g. Zhang San"
                  />
                </Field>
                <Field label="职称" required>
                  <SelectInput
                    value={form.title}
                    onChange={(v) => set("title", v as AcademicTitle)}
                    placeholder="请选择职称"
                    error={errors.title}
                  >
                    {ALL_TITLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </SelectInput>
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">请选择职称</p>
                  )}
                </Field>
                <Field label="所属院校" required>
                  <ComboboxInput
                    value={form.universityId}
                    onChange={(v) => {
                      set("universityId", v);
                      set("departmentId", "");
                    }}
                    options={universityOptions.map((u) => u.name)}
                    placeholder={
                      uniLoading ? "院校加载中..." : "搜索并选择院校"
                    }
                    error={errors.universityId}
                    disabled={uniLoading}
                  />
                  {errors.universityId && (
                    <p className="mt-1 text-xs text-red-500">请选择所属院校</p>
                  )}
                </Field>
                <Field label="所属院系" required>
                  <ComboboxInput
                    value={form.departmentId}
                    onChange={(v) => set("departmentId", v)}
                    options={selectedUni?.departments || []}
                    placeholder={
                      form.universityId ? "搜索并选择院系" : "请先选择院校"
                    }
                    error={errors.departmentId}
                    disabled={!form.universityId || uniLoading}
                  />
                  {errors.departmentId && (
                    <p className="mt-1 text-xs text-red-500">请选择所属院系</p>
                  )}
                </Field>
              </div>
            </FormSection>

            {/* 联系方式 */}
            <FormSection icon={<Mail className="w-4 h-4" />} title="联系与主页">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="电子邮箱">
                  <TextInput
                    value={form.email}
                    onChange={(v) => set("email", v)}
                    placeholder="example@university.edu.cn"
                    type="email"
                  />
                </Field>
                <Field label="联系电话">
                  <TextInput
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    placeholder="010-XXXXXXXX"
                  />
                </Field>
                <Field label="个人主页">
                  <TextInput
                    value={form.homepage}
                    onChange={(v) => set("homepage", v)}
                    placeholder="https://..."
                    type="url"
                  />
                </Field>
                <Field label="Google Scholar">
                  <TextInput
                    value={form.googleScholar}
                    onChange={(v) => set("googleScholar", v)}
                    placeholder="https://scholar.google.com/..."
                    type="url"
                  />
                </Field>
                <Field label="DBLP">
                  <TextInput
                    value={form.dblp}
                    onChange={(v) => set("dblp", v)}
                    placeholder="https://dblp.org/pid/..."
                    type="url"
                  />
                </Field>
              </div>
            </FormSection>

            {/* 研究方向 */}
            <FormSection
              icon={<BookOpen className="w-4 h-4" />}
              title="研究方向"
            >
              <TagInput
                tags={form.researchFields}
                onChange={(v) => set("researchFields", v)}
                placeholder="输入研究方向后按 Enter 或点击添加"
              />
            </FormSection>

            {/* 学术荣誉 */}
            <FormSection icon={<Award className="w-4 h-4" />} title="学术荣誉">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ALL_HONORS.map((h) => {
                  const checked = form.honors.includes(h);
                  return (
                    <label
                      key={h}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        checked
                          ? "bg-primary-50 border-primary-300"
                          : "bg-white border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleHonor(h)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          checked ? "text-primary-700" : "text-gray-700",
                        )}
                      >
                        {h}
                      </span>
                    </label>
                  );
                })}
              </div>
            </FormSection>

            {/* 个人简介 */}
            <FormSection icon={<User className="w-4 h-4" />} title="个人简介">
              <Field label="简介">
                <TextareaInput
                  value={form.bio}
                  onChange={(v) => set("bio", v)}
                  placeholder="请输入学者个人简介，包括主要研究方向、学术贡献等..."
                  rows={5}
                />
              </Field>
            </FormSection>

            {/* 合作信息 */}
            <FormSection
              icon={<Handshake className="w-4 h-4" />}
              title="合作信息"
            >
              <div className="space-y-5">
                <Field label="学部分类">
                  <SelectInput
                    value={form.scholarDivision}
                    onChange={(v) => set("scholarDivision", v)}
                    placeholder="请选择学部"
                  >
                    {SCHOLAR_DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="导师类型">
                  <div className="flex gap-4">
                    {(["教学研究型", "研究型"] as const).map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="mentorType"
                          value={type}
                          checked={form.mentorType === type}
                          onChange={() => set("mentorType", type)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field
                  label="人才计划"
                  hint="输入计划名称后按 Enter 或点击添加"
                >
                  <TagInput
                    tags={form.talentPlans}
                    onChange={(v) => set("talentPlans", v)}
                  />
                </Field>
              </div>
            </FormSection>

            {/* 学术指标 */}
            <FormSection
              icon={<BarChart2 className="w-4 h-4" />}
              title="学术指标"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field
                  label="H 指数"
                  hint="根据 Google Scholar 或 Web of Science"
                >
                  <TextInput
                    value={form.hIndex}
                    onChange={(v) => set("hIndex", v)}
                    placeholder="例如：45"
                    type="number"
                  />
                </Field>
                <Field label="被引次数" hint="总引用数量">
                  <TextInput
                    value={form.citationCount}
                    onChange={(v) => set("citationCount", v)}
                    placeholder="例如：12000"
                    type="number"
                  />
                </Field>
                <Field label="论文数量" hint="发表论文总数">
                  <TextInput
                    value={form.paperCount}
                    onChange={(v) => set("paperCount", v)}
                    placeholder="例如：150"
                    type="number"
                  />
                </Field>
              </div>
            </FormSection>

            {/* Bottom actions */}
            <div className="flex items-center justify-end gap-3 pt-2 pb-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存学者"
                )}
              </button>
            </div>
          </motion.div>
        </form>
      )}

      {/* Excel Import Tab */}
      {activeTab === "excel" && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 导入说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                使用说明
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>下载标准模板并填写单个学者的信息</li>
                <li>系统将自动检测并映射列标题（支持中文/英文）</li>
                <li>导入后可在"手动填写"选项卡继续编辑</li>
              </ul>
            </div>

            {/* 下载模板按钮 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 text-sm text-amber-800 font-medium hover:text-amber-900 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载 Excel 模板
              </button>
              <p className="text-xs text-amber-700 mt-2">
                下载标准模板以确保数据格式正确
              </p>
            </div>

            {/* 文件上传区域 */}
            <div
              onDragOver={handleExcelDragOver}
              onDragLeave={handleExcelDragLeave}
              onDrop={handleExcelDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                excelIsDragging
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-gray-400 bg-white",
              )}
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                拖拽 Excel 文件到此处，或点击选择文件
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelInputChange}
                className="hidden"
                id="excel-import-input"
              />
              <label
                htmlFor="excel-import-input"
                className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
              >
                选择文件
              </label>
              {excelFile && (
                <p className="mt-3 text-sm text-gray-500">
                  已选择: {excelFile.name}
                </p>
              )}
            </div>

            {/* 处理中指示 */}
            {excelIsProcessing && (
              <div className="text-center py-6">
                <div className="inline-block w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-600">
                  正在识别数据结构...
                </p>
              </div>
            )}

            {/* 解析结果 */}
            {excelParseResult && !excelIsProcessing && (
              <div className="space-y-4">
                {/* 成功 */}
                {excelParseResult.data.length > 0 &&
                  excelParseResult.errors.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-medium text-green-900">
                        成功解析 1 条学者数据
                      </p>
                    </div>
                  )}

                {/* 错误 */}
                {excelParseResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-sm font-medium text-red-900">
                        发现 {excelParseResult.errors.length} 个问题
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                      {excelParseResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          {error.row > 0 ? `第 ${error.row} 行: ` : ""}
                          {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 导入按钮 */}
                {excelParseResult.data.length > 0 &&
                  excelParseResult.errors.length === 0 && (
                    <button
                      onClick={handleExcelImport}
                      className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      导入数据到表单
                    </button>
                  )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Web Scraping Tab */}
      {activeTab === "scrape" && (
        <WebScrapingPanel
          onCancel={() => setActiveTab("manual")}
          onSuccess={(data) => {
            // Merge scraped data with form
            setForm((prev) => ({
              ...prev,
              name: data.name || prev.name,
              nameEn: data.nameEn || prev.nameEn,
              title: (data.title as AcademicTitle) || prev.title,
              email: data.email || prev.email,
              phone: data.phone || prev.phone,
              homepage: data.homepage || prev.homepage,
              researchFields: data.researchFields || prev.researchFields,
              bio: data.bio || prev.bio,
            }));
            // Switch to manual mode for editing
            setActiveTab("manual");
          }}
        />
      )}

      {/* Required hint */}
      {activeTab === "manual" && (
        <div className="max-w-5xl mx-auto px-6 pb-4 -mt-2">
          <p className="text-xs text-gray-400">
            <span className="text-red-500">*</span> 为必填项
          </p>
        </div>
      )}
    </div>
  );
}
