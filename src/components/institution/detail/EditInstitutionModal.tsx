import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, AlertTriangle } from "lucide-react";
import { patchInstitution } from "@/services/institutionApi";
import type { InstitutionDetail, InstitutionPatchRequest } from "@/types/institution";

export function EditInstitutionModal({
  institution,
  onClose,
  onSaved,
}: {
  institution: InstitutionDetail;
  onClose: () => void;
  onSaved: (updated: InstitutionDetail) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<InstitutionPatchRequest>({
    avatar: institution.avatar ?? "",
    category: institution.category ?? "",
    priority: institution.priority ?? "",
    student_count_24: institution.student_count_24 ?? undefined,
    student_count_25: institution.student_count_25 ?? undefined,
    mentor_count: institution.mentor_count ?? undefined,
    resident_leaders: institution.resident_leaders,
    degree_committee: institution.degree_committee,
    teaching_committee: institution.teaching_committee,
    key_departments: institution.key_departments,
    joint_labs: institution.joint_labs,
    training_cooperation: institution.training_cooperation,
    academic_cooperation: institution.academic_cooperation,
    talent_dual_appointment: institution.talent_dual_appointment,
    recruitment_events: institution.recruitment_events,
    visit_exchanges: institution.visit_exchanges,
    cooperation_focus: institution.cooperation_focus,
  });
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);

  function setArr(field: keyof InstitutionPatchRequest, value: string) {
    const arr = value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((f) => ({ ...f, [field]: arr }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      const updated = await patchInstitution(institution.id, form);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const FieldTextArea = ({
    label,
    field,
    value,
  }: {
    label: string;
    field: keyof InstitutionPatchRequest;
    value: string[];
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <textarea
        rows={3}
        defaultValue={value.join("\n")}
        onChange={(e) => setArr(field, e.target.value)}
        placeholder="每行一条"
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-slate-50 focus:bg-white transition-all"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">编辑机构信息</h2>
            <p className="text-xs text-slate-400 mt-0.5">{institution.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Avatar section */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              机构头像
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {form.avatar && !avatarImgFailed ? (
                  <img
                    src={form.avatar}
                    alt="头像预览"
                    className="w-full h-full object-contain p-1"
                    onError={() => setAvatarImgFailed(true)}
                  />
                ) : (
                  <span className="text-2xl font-black text-slate-400">
                    {institution.name.charAt(0)}
                  </span>
                )}
              </div>
              <input
                type="url"
                value={form.avatar ?? ""}
                onChange={(e) => {
                  setAvatarImgFailed(false);
                  setForm((f) => ({ ...f, avatar: e.target.value }));
                }}
                placeholder="https://example.com/logo.png"
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                类别
              </label>
              <input
                type="text"
                value={form.category ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="如: 京外C9"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                优先级
              </label>
              <input
                type="text"
                value={form.priority ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value }))
                }
                placeholder="如: A"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(
              [
                { label: "24 级学生数", field: "student_count_24" },
                { label: "25 级学生数", field: "student_count_25" },
                { label: "导师数", field: "mentor_count" },
              ] as const
            ).map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <input
                  type="number"
                  value={form[field] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [field]:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            ))}
          </div>

          <hr className="border-slate-100" />

          <FieldTextArea
            label="驻校负责人"
            field="resident_leaders"
            value={form.resident_leaders ?? []}
          />
          <FieldTextArea
            label="学位委员会"
            field="degree_committee"
            value={form.degree_committee ?? []}
          />
          <FieldTextArea
            label="教学委员会"
            field="teaching_committee"
            value={form.teaching_committee ?? []}
          />

          <hr className="border-slate-100" />

          <FieldTextArea
            label="重点合作院系"
            field="key_departments"
            value={form.key_departments ?? []}
          />
          <FieldTextArea
            label="联合实验室"
            field="joint_labs"
            value={form.joint_labs ?? []}
          />
          <FieldTextArea
            label="培养合作"
            field="training_cooperation"
            value={form.training_cooperation ?? []}
          />
          <FieldTextArea
            label="学术合作"
            field="academic_cooperation"
            value={form.academic_cooperation ?? []}
          />
          <FieldTextArea
            label="人才双聘"
            field="talent_dual_appointment"
            value={form.talent_dual_appointment ?? []}
          />

          <hr className="border-slate-100" />

          <FieldTextArea
            label="招募活动"
            field="recruitment_events"
            value={form.recruitment_events ?? []}
          />
          <FieldTextArea
            label="访问交流"
            field="visit_exchanges"
            value={form.visit_exchanges ?? []}
          />
          <FieldTextArea
            label="合作重点"
            field="cooperation_focus"
            value={form.cooperation_focus ?? []}
          />

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            保存更改
          </button>
        </div>
      </motion.div>
    </div>
  );
}
