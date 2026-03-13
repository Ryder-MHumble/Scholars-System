import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import type {
  ScholarDetail,
  ScholarDetailPatch,
  UniversityOption,
} from "@/services/scholarApi";
import { fetchUniversities } from "@/services/scholarApi";
import { cn } from "@/utils/cn";

interface EditProfileModalProps {
  scholar: ScholarDetail;
  onClose: () => void;
  onSubmit: (patch: ScholarDetailPatch) => Promise<void>;
}

export function EditProfileModal({
  scholar,
  onClose,
  onSubmit,
}: EditProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: scholar.name || "",
    name_en: scholar.name_en || "",
    photo_url: scholar.photo_url || "",
    university: scholar.university || "",
    department: scholar.department || "",
    position: scholar.position || "",
    email: scholar.email || "",
    phone: scholar.phone || "",
    office: scholar.office || "",
    profile_url: scholar.profile_url || "",
    google_scholar_url: scholar.google_scholar_url || "",
    dblp_url: scholar.dblp_url || "",
    lab_url: scholar.lab_url || "",
    orcid: scholar.orcid || "",
    bio: scholar.bio || "",
    bio_en: scholar.bio_en || "",
    research_areas: (scholar.research_areas ?? []).join(", "),
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Universities autocomplete
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  useEffect(() => {
    fetchUniversities().then(setUniversities).catch(() => {});
  }, []);

  const universityNames = universities.map((u) => u.university);
  const departmentsForCurrent =
    universities.find((u) => u.university === form.university)?.departments ??
    [];

  // Build patch: only changed fields
  const buildPatch = (): ScholarDetailPatch => {
    const patch: ScholarDetailPatch = {};
    const check = (
      key: keyof ScholarDetailPatch,
      formVal: string,
      origVal: string | undefined | null,
    ) => {
      if (formVal !== (origVal ?? "")) {
        (patch as Record<string, unknown>)[key] = formVal;
      }
    };

    check("name", form.name, scholar.name);
    check("name_en", form.name_en, scholar.name_en);
    check("photo_url", form.photo_url, scholar.photo_url);
    check("university", form.university, scholar.university);
    check("department", form.department, scholar.department);
    check("position", form.position, scholar.position);
    check("email", form.email, scholar.email);
    check("phone", form.phone, scholar.phone);
    check("office", form.office, scholar.office);
    check("profile_url", form.profile_url, scholar.profile_url);
    check("google_scholar_url", form.google_scholar_url, scholar.google_scholar_url);
    check("dblp_url", form.dblp_url, scholar.dblp_url);
    check("lab_url", form.lab_url, scholar.lab_url);
    check("orcid", form.orcid, scholar.orcid);
    check("bio", form.bio, scholar.bio);
    check("bio_en", form.bio_en, scholar.bio_en);

    const newAreas = form.research_areas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const oldAreas = scholar.research_areas ?? [];
    if (JSON.stringify(newAreas) !== JSON.stringify(oldAreas)) {
      patch.research_areas = newAreas;
    }

    return patch;
  };

  const handleSubmit = async () => {
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit(patch);
      onClose();
    } catch {
      // stay open on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">编辑学者资料</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Basic Info */}
          <Section title="基本信息">
            <div className="grid grid-cols-2 gap-3">
              <Field label="姓名" value={form.name} onChange={(v) => set("name", v)} />
              <Field label="英文名" value={form.name_en} onChange={(v) => set("name_en", v)} placeholder="English Name" />
            </div>
            <Field label="头像 URL" value={form.photo_url} onChange={(v) => set("photo_url", v)} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-3">
              <AutocompleteField
                label="院校"
                value={form.university}
                onChange={(v) => set("university", v)}
                options={universityNames}
              />
              <AutocompleteField
                label="院系"
                value={form.department}
                onChange={(v) => set("department", v)}
                options={departmentsForCurrent}
              />
            </div>
            <Field label="职称" value={form.position} onChange={(v) => set("position", v)} placeholder="教授 / 副教授 / ..." />
          </Section>

          {/* Contact */}
          <Section title="联系方式">
            <div className="grid grid-cols-2 gap-3">
              <Field label="邮箱" value={form.email} onChange={(v) => set("email", v)} placeholder="email@example.com" />
              <Field label="电话" value={form.phone} onChange={(v) => set("phone", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="办公室" value={form.office} onChange={(v) => set("office", v)} />
              <Field label="个人主页" value={form.profile_url} onChange={(v) => set("profile_url", v)} placeholder="https://..." />
            </div>
          </Section>

          {/* Academic Links */}
          <Section title="学术链接">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Google Scholar" value={form.google_scholar_url} onChange={(v) => set("google_scholar_url", v)} placeholder="https://..." />
              <Field label="DBLP" value={form.dblp_url} onChange={(v) => set("dblp_url", v)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="实验室网站" value={form.lab_url} onChange={(v) => set("lab_url", v)} placeholder="https://..." />
              <Field label="ORCID" value={form.orcid} onChange={(v) => set("orcid", v)} placeholder="0000-0000-0000-0000" />
            </div>
          </Section>

          {/* Bio */}
          <Section title="个人简介">
            <TextareaField label="中文简介" value={form.bio} onChange={(v) => set("bio", v)} rows={4} />
            <TextareaField label="英文简介" value={form.bio_en} onChange={(v) => set("bio_en", v)} rows={3} />
          </Section>

          {/* Research Areas */}
          <Section title="研究方向">
            <Field
              label="研究方向"
              value={form.research_areas}
              onChange={(v) => set("research_areas", v)}
              placeholder="多个方向用逗号分隔"
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-100">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors resize-none"
      />
    </div>
  );
}

function AutocompleteField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlightIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIdx((i) => Math.max(i - 1, -1));
            } else if (e.key === "Enter" && highlightIdx >= 0 && filtered[highlightIdx]) {
              e.preventDefault();
              onChange(filtered[highlightIdx]);
              setOpen(false);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
        />
        {options.length > 0 && (
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {filtered.slice(0, 30).map((opt, i) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setOpen(false);
              }}
              onMouseEnter={() => setHighlightIdx(i)}
              className={cn(
                "px-3 py-1.5 cursor-pointer truncate",
                i === highlightIdx
                  ? "bg-primary-50 text-primary-700"
                  : "hover:bg-gray-50 text-gray-700",
              )}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
