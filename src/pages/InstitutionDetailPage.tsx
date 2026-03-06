import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  UserCheck,
  Layers,
  Handshake,
  CalendarDays,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  BookOpen,
  FlaskConical,
  UserCog,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  fetchInstitutionDetail,
  patchInstitution,
  deleteInstitution,
} from "@/services/institutionApi";
import type {
  InstitutionDetail,
  InstitutionPatchRequest,
} from "@/types/institution";

// ── Logo utilities (same as InstitutionCard) ──────────────────────────────

const DOMAIN_MAP: Record<string, string> = {
  北京大学: "pku.edu.cn",
  清华大学: "tsinghua.edu.cn",
  复旦大学: "fudan.edu.cn",
  浙江大学: "zju.edu.cn",
  上海交通大学: "sjtu.edu.cn",
  南京大学: "nju.edu.cn",
  武汉大学: "whu.edu.cn",
  中山大学: "sysu.edu.cn",
  哈尔滨工业大学: "hit.edu.cn",
  北京航空航天大学: "buaa.edu.cn",
  北京理工大学: "bit.edu.cn",
  华中科技大学: "hust.edu.cn",
  西安交通大学: "xjtu.edu.cn",
  同济大学: "tongji.edu.cn",
  中国科学院大学: "ucas.ac.cn",
  中国人民大学: "ruc.edu.cn",
  北京师范大学: "bnu.edu.cn",
  厦门大学: "xmu.edu.cn",
  四川大学: "scu.edu.cn",
  吉林大学: "jlu.edu.cn",
  大连理工大学: "dlut.edu.cn",
  东北大学: "neu.edu.cn",
  南开大学: "nankai.edu.cn",
  天津大学: "tju.edu.cn",
  重庆大学: "cqu.edu.cn",
  中南大学: "csu.edu.cn",
  华南理工大学: "scut.edu.cn",
  电子科技大学: "uestc.edu.cn",
  兰州大学: "lzu.edu.cn",
  中国农业大学: "cau.edu.cn",
  中国海洋大学: "ouc.edu.cn",
  北京邮电大学: "bupt.edu.cn",
  华东师范大学: "ecnu.edu.cn",
  中国科学技术大学: "ustc.edu.cn",
  东南大学: "seu.edu.cn",
  山东大学: "sdu.edu.cn",
  湖南大学: "hnu.edu.cn",
  西北工业大学: "nwpu.edu.cn",
  中央民族大学: "muc.edu.cn",
  西北农林科技大学: "nwafu.edu.cn",
  北京交通大学: "bjtu.edu.cn",
  北京科技大学: "ustb.edu.cn",
  北京化工大学: "buct.edu.cn",
  北京林业大学: "bjfu.edu.cn",
  中央财经大学: "cufe.edu.cn",
  对外经济贸易大学: "uibe.edu.cn",
  北京外国语大学: "bfsu.edu.cn",
  北京语言大学: "blcu.edu.cn",
  首都师范大学: "cnu.edu.cn",
  首都医科大学: "ccmu.edu.cn",
  北京中关村学院: "bjzgc.edu.cn",
  北京工业大学: "bjut.edu.cn",
  中国政法大学: "cupl.edu.cn",
  北京协和医学院: "pumc.edu.cn",
  北京中医药大学: "bucm.edu.cn",
  中央音乐学院: "ccom.edu.cn",
  中国传媒大学: "cuc.edu.cn",
  北京体育大学: "bsu.edu.cn",
  中国矿业大学: "cumt.edu.cn",
  中国石油大学: "cup.edu.cn",
  华北电力大学: "ncepu.edu.cn",
  上海大学: "shu.edu.cn",
  华东理工大学: "ecust.edu.cn",
  东华大学: "dhu.edu.cn",
  上海财经大学: "sufe.edu.cn",
  上海外国语大学: "shisu.edu.cn",
  上海音乐学院: "shcmusic.edu.cn",
  南京理工大学: "njust.edu.cn",
  南京航空航天大学: "nuaa.edu.cn",
  河海大学: "hhu.edu.cn",
  苏州大学: "suda.edu.cn",
  南京农业大学: "njau.edu.cn",
  南京医科大学: "njmu.edu.cn",
  中国药科大学: "cpu.edu.cn",
  西安电子科技大学: "xidian.edu.cn",
  长安大学: "chd.edu.cn",
  西北大学: "nwu.edu.cn",
  陕西师范大学: "snnu.edu.cn",
  浙江工业大学: "zjut.edu.cn",
  宁波大学: "nbu.edu.cn",
  中国美术学院: "caa.edu.cn",
  深圳大学: "szu.edu.cn",
  华南师范大学: "scnu.edu.cn",
  暨南大学: "jnu.edu.cn",
  南方科技大学: "sustech.edu.cn",
  哈尔滨工程大学: "hrbeu.edu.cn",
  东北林业大学: "nefu.edu.cn",
  东北农业大学: "neau.edu.cn",
  湖南师范大学: "hunnu.edu.cn",
  中南财经政法大学: "zuel.edu.cn",
  华中师范大学: "ccnu.edu.cn",
  华中农业大学: "hzau.edu.cn",
  武汉理工大学: "whut.edu.cn",
  云南大学: "ynu.edu.cn",
  贵州大学: "gzu.edu.cn",
  四川农业大学: "sicau.edu.cn",
  西南交通大学: "swjtu.edu.cn",
  西南大学: "swu.edu.cn",
  电子科技大学成都: "uestc.edu.cn",
  郑州大学: "zzu.edu.cn",
  河南大学: "henu.edu.cn",
  合肥工业大学: "hfut.edu.cn",
  安徽大学: "ahu.edu.cn",
  福州大学: "fzu.edu.cn",
  江南大学: "jiangnan.edu.cn",
  南昌大学: "ncu.edu.cn",
  广西大学: "gxu.edu.cn",
  海南大学: "hainanu.edu.cn",
  石河子大学: "shzu.edu.cn",
  新疆大学: "xju.edu.cn",
  青海大学: "qhu.edu.cn",
  西藏大学: "utibet.edu.cn",
  内蒙古大学: "imu.edu.cn",
  宁夏大学: "nxu.edu.cn",
};

const SVG_LOGO_MAP: Record<string, string> = {
  // 仅包含已验证可用的 Wikimedia Commons SVG
  清华大学:
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/Tsinghua_University_Logo.svg",
  // 其他大学使用 Google Favicon API 或 fallback
};

function getLogoSrc(name: string): string | null {
  if (SVG_LOGO_MAP[name]) return SVG_LOGO_MAP[name];
  const domain = DOMAIN_MAP[name];
  if (domain)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  return null;
}

const MONOGRAM_GRADIENTS = [
  "from-blue-600 to-indigo-700",
  "from-violet-600 to-purple-700",
  "from-emerald-600 to-teal-700",
  "from-rose-600 to-pink-700",
  "from-amber-500 to-orange-600",
  "from-teal-600 to-cyan-700",
  "from-indigo-600 to-blue-700",
  "from-pink-600 to-rose-700",
] as const;

function getGradient(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MONOGRAM_GRADIENTS[h % MONOGRAM_GRADIENTS.length];
}

function UniversityLogo({ name, id }: { name: string; id: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoSrc = getLogoSrc(name);
  const gradient = getGradient(id);
  const initial = name.trim().charAt(0);

  if (logoSrc && !imgFailed) {
    return (
      <div className="w-24 h-24 rounded-3xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center overflow-hidden shrink-0 p-2.5">
        <img
          src={logoSrc}
          alt={`${name} logo`}
          className="w-full h-full object-contain"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-xl`}
    >
      <span className="text-white text-4xl font-black leading-none">
        {initial}
      </span>
    </div>
  );
}

// ── UI primitives ──────────────────────────────────────────────────────────

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-700 border border-blue-200/50">
      {label}
    </span>
  );
}

function PriorityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-700 border border-amber-200/50">
      ★ {label}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-all hover:shadow-sm">
      {children}
    </span>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

const STAT_STYLES = [
  {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    numColor: "text-blue-700",
  },
  {
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    numColor: "text-violet-700",
  },
  {
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    numColor: "text-emerald-700",
  },
  {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    numColor: "text-amber-700",
  },
  {
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    numColor: "text-rose-700",
  },
] as const;

function StatCard({
  label,
  value,
  icon: Icon,
  styleIdx,
}: {
  label: string;
  value: number | null | undefined;
  icon: React.ElementType;
  styleIdx: number;
}) {
  const s = STAT_STYLES[styleIdx % STAT_STYLES.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: styleIdx * 0.05 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-5 flex flex-col gap-3.5"
    >
      <div
        className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-5 h-5 ${s.iconColor}`} />
      </div>
      <div>
        <p
          className={`text-3xl font-black ${value != null ? s.numColor : "text-slate-300"} leading-none`}
        >
          {value ?? "—"}
        </p>
        <p className="text-xs text-slate-500 font-semibold mt-2">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Collapsible section ────────────────────────────────────────────────────

const SECTION_STYLES = [
  { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { iconBg: "bg-violet-100", iconColor: "text-violet-600" },
  { iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  { iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
] as const;

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  styleIdx = 0,
  count,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  styleIdx?: number;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const s = SECTION_STYLES[styleIdx % SECTION_STYLES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4.5 hover:bg-slate-50/50 transition-colors group"
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
          >
            <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
          </div>
          <span className="text-sm font-bold text-slate-800">{title}</span>
          {count != null && count > 0 && (
            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
              {count}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 border-t border-slate-50 pt-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Person avatar & list ───────────────────────────────────────────────────

function PersonAvatar({ name }: { name: string }) {
  const char = name.trim().charAt(0);
  const colors = [
    "bg-blue-400",
    "bg-violet-400",
    "bg-emerald-400",
    "bg-rose-400",
    "bg-amber-400",
    "bg-teal-400",
    "bg-indigo-400",
    "bg-pink-400",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <div
      className={`w-9 h-9 ${colors[h % colors.length]} rounded-full flex items-center justify-center shrink-0`}
    >
      <span className="text-white text-sm font-bold leading-none">{char}</span>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length)
    return <p className="text-sm text-slate-400 italic">暂无数据</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Tag key={i}>{item}</Tag>
      ))}
    </div>
  );
}

function PersonList({
  items,
}: {
  items: {
    name: string;
    title: string | null;
    department: string | null;
    research_area: string | null;
  }[];
}) {
  if (!items.length)
    return <p className="text-sm text-slate-400 italic">暂无数据</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((person, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 hover:shadow-sm transition-all group"
        >
          <PersonAvatar name={person.name} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 whitespace-pre-line leading-snug group-hover:text-slate-900">
              {person.name}
            </p>
            {person.title && (
              <p className="text-xs text-slate-500 mt-1">{person.title}</p>
            )}
            {person.department && (
              <p className="text-xs text-slate-500">{person.department}</p>
            )}
            {person.research_area && (
              <p className="text-xs text-blue-600 font-medium mt-1.5 bg-blue-50 px-2 py-1 rounded inline-block">
                {person.research_area}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────

function EditModal({
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

// ── Delete confirm ─────────────────────────────────────────────────────────

function DeleteConfirm({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex gap-4 mb-5">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">删除机构</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              此操作不可撤销，请谨慎操作
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 mb-5">
          确定要删除{" "}
          <span className="font-bold text-slate-900">「{name}」</span> 吗？
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await onConfirm();
            }}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            确认删除
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState<InstitutionDetail | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchInstitutionDetail(id)
      .then(setInstitution)
      .catch(() => setInstitution(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!institution) return;
    await deleteInstitution(institution.id);
    navigate("/?tab=institutions");
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-3 font-medium">
            机构不存在或加载失败
          </p>
          <button
            onClick={() => navigate("/?tab=institutions")}
            className="text-blue-600 hover:underline text-sm"
          >
            ← 返回机构库
          </button>
        </div>
      </div>
    );
  }

  const hasLeadership =
    institution.resident_leaders.length > 0 ||
    institution.degree_committee.length > 0 ||
    institution.teaching_committee.length > 0;

  const hasCooperation =
    institution.key_departments.length > 0 ||
    institution.joint_labs.length > 0 ||
    institution.training_cooperation.length > 0 ||
    institution.academic_cooperation.length > 0 ||
    institution.talent_dual_appointment.length > 0;

  const hasActivities =
    institution.recruitment_events.length > 0 ||
    institution.visit_exchanges.length > 0 ||
    institution.cooperation_focus.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          {/* Back button */}
          <div className="py-3 border-b border-slate-700/50">
            <button
              onClick={() => navigate("/?tab=institutions")}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              机构库
            </button>
          </div>

          {/* Institution identity */}
          <div className="py-7 flex items-start justify-between gap-6">
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <UniversityLogo name={institution.name} id={institution.id} />
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                  {institution.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 mt-3">
                  {institution.org_name && (
                    <span className="text-xs text-slate-300 font-medium">
                      {institution.org_name}
                    </span>
                  )}
                  {institution.category && (
                    <CategoryBadge label={institution.category} />
                  )}
                  {institution.priority && (
                    <PriorityBadge label={institution.priority} />
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all"
              >
                <Edit2 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          <StatCard
            label="学者总数"
            value={institution.scholar_count}
            icon={Users}
            styleIdx={0}
          />
          <StatCard
            label="24 级学生"
            value={institution.student_count_24}
            icon={GraduationCap}
            styleIdx={1}
          />
          <StatCard
            label="25 级学生"
            value={institution.student_count_25}
            icon={GraduationCap}
            styleIdx={2}
          />
          <StatCard
            label="学生总数"
            value={institution.student_count_total}
            icon={BookOpen}
            styleIdx={3}
          />
          <StatCard
            label="导师数"
            value={institution.mentor_count}
            icon={UserCog}
            styleIdx={4}
          />
        </div>

        {/* Leadership */}
        <Section
          title="负责人 & 委员会"
          icon={UserCheck}
          styleIdx={0}
          count={
            institution.resident_leaders.length +
            institution.degree_committee.length +
            institution.teaching_committee.length
          }
        >
          {!hasLeadership ? (
            <p className="text-sm text-slate-400 italic">暂无数据</p>
          ) : (
            <div className="space-y-4">
              {institution.resident_leaders.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    驻校负责人
                  </p>
                  <TagList items={institution.resident_leaders} />
                </div>
              )}
              {institution.degree_committee.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    学位委员会
                  </p>
                  <TagList items={institution.degree_committee} />
                </div>
              )}
              {institution.teaching_committee.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    教学委员会
                  </p>
                  <TagList items={institution.teaching_committee} />
                </div>
              )}
            </div>
          )}
        </Section>

        {/* University leaders */}
        {institution.university_leaders.length > 0 && (
          <Section
            title="大学领导"
            icon={GraduationCap}
            styleIdx={1}
            count={institution.university_leaders.length}
          >
            <PersonList items={institution.university_leaders} />
          </Section>
        )}

        {/* Notable scholars */}
        {institution.notable_scholars.length > 0 && (
          <Section
            title="知名学者"
            icon={Users}
            styleIdx={2}
            count={institution.notable_scholars.length}
          >
            <PersonList items={institution.notable_scholars} />
          </Section>
        )}

        {/* Departments */}
        <Section
          title="院系信息"
          icon={Layers}
          styleIdx={3}
          count={institution.departments.length}
        >
          {institution.departments.length === 0 ? (
            <p className="text-sm text-slate-400 italic">暂无院系数据</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const maxCount = Math.max(
                  ...institution.departments.map((d) => d.scholar_count),
                  1,
                );
                return institution.departments.map((dept) => (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all hover:shadow-sm"
                  >
                    {/* Left accent bar */}
                    <div className="w-1 h-auto min-h-[60px] rounded-full bg-gradient-to-b from-blue-500 to-blue-300 flex-shrink-0 mt-1" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <p className="text-sm font-bold text-slate-800">
                          {dept.name}
                        </p>
                        <p className="text-xl font-black text-blue-600 flex-shrink-0">
                          {dept.scholar_count}
                        </p>
                      </div>

                      {dept.org_name && dept.org_name !== dept.name && (
                        <p className="text-xs text-slate-400 mb-2 truncate">
                          {dept.org_name}
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
                          style={{
                            width: `${(dept.scholar_count / maxCount) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Data sources */}
                      {dept.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {dept.sources.map((src) => (
                            <span
                              key={src.source_id}
                              className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                                src.is_enabled
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {src.source_name}
                              {src.scholar_count > 0 &&
                                ` · ${src.scholar_count}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          )}
        </Section>

        {/* Cooperation */}
        {hasCooperation && (
          <Section title="合作项目" icon={Handshake} styleIdx={4}>
            <div className="space-y-4">
              {institution.key_departments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    重点合作院系
                  </p>
                  <TagList items={institution.key_departments} />
                </div>
              )}
              {institution.joint_labs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    联合实验室
                  </p>
                  <TagList items={institution.joint_labs} />
                </div>
              )}
              {institution.training_cooperation.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    培养合作
                  </p>
                  <TagList items={institution.training_cooperation} />
                </div>
              )}
              {institution.academic_cooperation.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    学术合作
                  </p>
                  <TagList items={institution.academic_cooperation} />
                </div>
              )}
              {institution.talent_dual_appointment.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    人才双聘
                  </p>
                  <TagList items={institution.talent_dual_appointment} />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Activities */}
        {hasActivities && (
          <Section
            title="合作动态"
            icon={CalendarDays}
            styleIdx={5}
            defaultOpen={false}
          >
            <div className="space-y-4">
              {institution.recruitment_events.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    招募活动
                  </p>
                  <div className="space-y-1.5">
                    {institution.recruitment_events.map((event, i) => (
                      <p
                        key={i}
                        className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-2.5 leading-relaxed"
                      >
                        {event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {institution.visit_exchanges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    访问交流
                  </p>
                  <div className="space-y-1.5">
                    {institution.visit_exchanges.map((event, i) => (
                      <p
                        key={i}
                        className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-2.5 leading-relaxed"
                      >
                        {event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {institution.cooperation_focus.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    合作重点
                  </p>
                  <TagList items={institution.cooperation_focus} />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* View all scholars */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">学者数据库</p>
                <p className="text-sm text-blue-100 mt-0.5">
                  该机构收录{" "}
                  <span className="font-bold text-white">
                    {institution.scholar_count}
                  </span>{" "}
                  位学者的详细信息
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/?tab=scholars&university=${encodeURIComponent(institution.name)}`,
                )
              }
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <Users className="w-5 h-5" />
              查看全部
            </button>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editOpen && (
          <EditModal
            institution={institution}
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => {
              setInstitution(updated);
              setEditOpen(false);
            }}
          />
        )}
        {deleteOpen && (
          <DeleteConfirm
            name={institution.name}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
