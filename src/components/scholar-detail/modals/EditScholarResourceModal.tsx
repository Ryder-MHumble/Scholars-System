import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BaseModal } from "@/components/common/BaseModal";
import type {
  AcademicPosition,
  AcademicPositionCreate,
  OpenSourceProject,
  OpenSourceProjectCreate,
  ResearchProject,
  ResearchProjectCreate,
} from "@/services/scholarApi";

export type ScholarResourceKind = "research" | "openSource" | "positions";
export type EditableScholarResource =
  | ResearchProject
  | OpenSourceProject
  | AcademicPosition;
export type ScholarResourcePayload =
  | ResearchProjectCreate
  | OpenSourceProjectCreate
  | AcademicPositionCreate;

interface Props {
  kind: ScholarResourceKind;
  item?: EditableScholarResource;
  onClose: () => void;
  onSubmit: (payload: ScholarResourcePayload) => Promise<void>;
}

const LABELS = {
  research: "科研项目",
  openSource: "开源项目",
  positions: "学术兼职",
} as const;

function initialForm(item?: EditableScholarResource) {
  return {
    name: "name" in (item ?? {}) ? String((item as ResearchProject | OpenSourceProject).name ?? "") : "",
    organization: String((item as ResearchProject | AcademicPosition | undefined)?.organization ?? ""),
    department: String((item as AcademicPosition | undefined)?.department ?? ""),
    title: String((item as AcademicPosition | undefined)?.title ?? ""),
    role: String((item as ResearchProject | OpenSourceProject | undefined)?.role ?? ""),
    project_type: String((item as ResearchProject | undefined)?.project_type ?? ""),
    position_type: String((item as AcademicPosition | undefined)?.position_type ?? ""),
    platform: String((item as OpenSourceProject | undefined)?.platform ?? ""),
    language: String((item as OpenSourceProject | undefined)?.language ?? ""),
    repository_url: String((item as OpenSourceProject | undefined)?.repository_url ?? ""),
    homepage_url: String((item as OpenSourceProject | undefined)?.homepage_url ?? ""),
    stars: String((item as OpenSourceProject | undefined)?.stars ?? ""),
    forks: String((item as OpenSourceProject | undefined)?.forks ?? ""),
    status: String((item as ResearchProject | OpenSourceProject | undefined)?.status ?? ""),
    start_date: String((item as ResearchProject | AcademicPosition | undefined)?.start_date ?? ""),
    end_date: String((item as ResearchProject | AcademicPosition | undefined)?.end_date ?? ""),
    released_at: String((item as OpenSourceProject | undefined)?.released_at ?? ""),
    description: String(item?.description ?? ""),
    source_url: String(item?.source_url ?? ""),
    is_current: Boolean((item as AcademicPosition | undefined)?.is_current),
  };
}

export function EditScholarResourceModal({ kind, item, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(() => initialForm(item));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const label = LABELS[kind];

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    const requiredMissing =
      kind === "positions"
        ? !form.organization.trim() || !form.title.trim()
        : !form.name.trim();
    if (requiredMissing) return;

    let payload: ScholarResourcePayload;
    if (kind === "research") {
      payload = {
        name: form.name.trim(),
        role: nullable(form.role),
        organization: nullable(form.organization),
        project_type: nullable(form.project_type),
        start_date: nullable(form.start_date),
        end_date: nullable(form.end_date),
        status: nullable(form.status),
        description: nullable(form.description),
        source_url: nullable(form.source_url),
      };
    } else if (kind === "openSource") {
      payload = {
        name: form.name.trim(),
        repository_url: nullable(form.repository_url),
        homepage_url: nullable(form.homepage_url),
        platform: nullable(form.platform),
        role: nullable(form.role),
        language: nullable(form.language),
        stars: nullableNumber(form.stars),
        forks: nullableNumber(form.forks),
        status: nullable(form.status),
        released_at: nullable(form.released_at),
        description: nullable(form.description),
        source_url: nullable(form.source_url),
      };
    } else {
      payload = {
        organization: form.organization.trim(),
        department: nullable(form.department),
        title: form.title.trim(),
        position_type: nullable(form.position_type),
        start_date: nullable(form.start_date),
        end_date: form.is_current ? null : nullable(form.end_date),
        is_current: form.is_current,
        description: nullable(form.description),
        source_url: nullable(form.source_url),
      };
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(payload);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : `${label}保存失败`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title={`${item ? "编辑" : "新增"}${label}`}
      maxWidth="xl"
      closeOnBackdropClick={!isSubmitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            取消
          </button>
          <button type="button" onClick={() => void submit()} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            保存
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {error && <p className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {kind !== "positions" && <Field label={`${kind === "research" ? "项目名称" : "项目名称"} *`} value={form.name} onChange={(value) => update("name", value)} span />}
        {kind === "positions" && (
          <>
            <Field label="兼职机构 *" value={form.organization} onChange={(value) => update("organization", value)} />
            <Field label="职务 *" value={form.title} onChange={(value) => update("title", value)} />
            <Field label="部门" value={form.department} onChange={(value) => update("department", value)} />
            <Field label="兼职类型" value={form.position_type} onChange={(value) => update("position_type", value)} />
          </>
        )}
        {kind === "research" && (
          <>
            <Field label="承担角色" value={form.role} onChange={(value) => update("role", value)} />
            <Field label="项目机构" value={form.organization} onChange={(value) => update("organization", value)} />
            <Field label="项目类型" value={form.project_type} onChange={(value) => update("project_type", value)} />
            <Field label="状态" value={form.status} onChange={(value) => update("status", value)} />
          </>
        )}
        {kind === "openSource" && (
          <>
            <Field label="仓库 URL" type="url" value={form.repository_url} onChange={(value) => update("repository_url", value)} span />
            <Field label="主页 URL" type="url" value={form.homepage_url} onChange={(value) => update("homepage_url", value)} span />
            <Field label="平台" value={form.platform} onChange={(value) => update("platform", value)} />
            <Field label="主要语言" value={form.language} onChange={(value) => update("language", value)} />
            <Field label="承担角色" value={form.role} onChange={(value) => update("role", value)} />
            <Field label="状态" value={form.status} onChange={(value) => update("status", value)} />
            <Field label="Stars" type="number" min="0" value={form.stars} onChange={(value) => update("stars", value)} />
            <Field label="Forks" type="number" min="0" value={form.forks} onChange={(value) => update("forks", value)} />
            <Field label="发布日期" type="date" value={form.released_at} onChange={(value) => update("released_at", value)} />
          </>
        )}
        {kind !== "openSource" && (
          <>
            <Field label="开始日期" type="date" value={form.start_date} onChange={(value) => update("start_date", value)} />
            <Field label="结束日期" type="date" value={form.end_date} onChange={(value) => update("end_date", value)} disabled={kind === "positions" && form.is_current} />
          </>
        )}
        {kind === "positions" && (
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input type="checkbox" checked={form.is_current} onChange={(event) => update("is_current", event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            当前兼职
          </label>
        )}
        <Field label="来源 URL" type="url" value={form.source_url} onChange={(value) => update("source_url", value)} span />
        <label className="block text-sm text-gray-700 sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-gray-500">描述</span>
          <textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={4} className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400" />
        </label>
      </div>
    </BaseModal>
  );
}

function Field({
  label,
  value,
  onChange,
  span = false,
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  span?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className={`block text-sm text-gray-700 ${span ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <input {...inputProps} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-primary-400 disabled:bg-gray-50" />
    </label>
  );
}

function nullable(value: string): string | null {
  return value.trim() || null;
}

function nullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}
