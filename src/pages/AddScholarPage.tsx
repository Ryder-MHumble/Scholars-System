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
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { AcademicTitle, AcademicHonor } from "@/types";
import { FormSection } from "@/components/ui/FormSection";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { TextareaInput } from "@/components/ui/TextareaInput";
import { SelectInput } from "@/components/ui/SelectInput";
import { TagInput } from "@/components/common/TagInput";
import { SuccessOverlay } from "@/components/common/SuccessOverlay";
import { useUniversityCounts } from "@/hooks/useUniversityCounts";
import {
  ALL_TITLES,
  ALL_HONORS,
  SCHOLAR_DIVISIONS,
} from "@/constants/scholarForm";

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

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    console.log("New scholar data:", form);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {submitted && (
        <SuccessOverlay onAction={() => navigate("/scholars")} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
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
            <p className="text-xs text-gray-400">填写学者基本信息与学术档案</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              form="add-scholar-form"
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
            >
              保存学者
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        id="add-scholar-form"
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto px-6 py-8 space-y-5"
      >
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
                <SelectInput
                  value={form.universityId}
                  onChange={(v) => {
                    set("universityId", v);
                    set("departmentId", "");
                  }}
                  placeholder={uniLoading ? "院校加载中..." : "请选择院校"}
                  error={errors.universityId}
                  disabled={uniLoading}
                >
                  {universityOptions.map((u) => (
                    <option key={u.name} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </SelectInput>
                {errors.universityId && (
                  <p className="mt-1 text-xs text-red-500">请选择所属院校</p>
                )}
              </Field>
              <Field label="所属院系" required>
                <SelectInput
                  value={form.departmentId}
                  onChange={(v) => set("departmentId", v)}
                  placeholder={
                    form.universityId ? "请选择院系" : "请先选择院校"
                  }
                  error={errors.departmentId}
                  disabled={!form.universityId || uniLoading}
                >
                  {selectedUni && selectedUni.departments.length > 0
                    ? selectedUni.departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))
                    : form.universityId && <option disabled>无可用院系</option>}
                </SelectInput>
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
          <FormSection icon={<BookOpen className="w-4 h-4" />} title="研究方向">
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
              <Field label="人才计划" hint="输入计划名称后按 Enter 或点击添加">
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
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
            >
              保存学者
            </button>
          </div>
        </motion.div>
      </form>

      {/* Required hint */}
      <div className="max-w-4xl mx-auto px-6 pb-4 -mt-2">
        <p className="text-xs text-gray-400">
          <span className="text-red-500">*</span> 为必填项
        </p>
      </div>
    </div>
  );
}
