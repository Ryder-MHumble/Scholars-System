import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowUpRight } from "lucide-react";
import type { InstitutionListItem } from "@/types/institution";

// ── University domain map → Google favicon as logo source ──────────────────
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

// Known high-quality Wikimedia SVG logos (only verified working URLs)
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

// ── Monogram fallback (styled letter-based avatar) ─────────────────────────

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

// ── Dept color accents ─────────────────────────────────────────────────────

const DEPT_ACCENTS = [
  "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
  "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
] as const;

function getDeptAccent(id: string, idx: number) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return DEPT_ACCENTS[(h + idx) % DEPT_ACCENTS.length];
}

// ── University logo component ──────────────────────────────────────────────

function UniversityLogo({ name, id }: { name: string; id: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoSrc = getLogoSrc(name);
  const gradient = getGradient(id);
  const initial = name.trim().charAt(0);

  if (logoSrc && !imgFailed) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1">
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
      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}
    >
      <span className="text-white text-xl font-black leading-none tracking-tight">
        {initial}
      </span>
    </div>
  );
}

// ── Main card component ────────────────────────────────────────────────────

interface InstitutionCardProps {
  institution: InstitutionListItem;
  index: number;
}

export function InstitutionCard({ institution, index }: InstitutionCardProps) {
  const navigate = useNavigate();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      onClick={() => navigate(`/institutions/${institution.id}`)}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getGradient(institution.id)} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
      />

      <div className="p-5">
        {/* Header: logo + name */}
        <div className="flex items-start gap-3.5">
          <UniversityLogo name={institution.name} id={institution.id} />

          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
              {institution.name}
            </h3>
            {institution.org_name && (
              <p className="text-[10px] text-slate-400 mt-1 truncate font-medium">
                {institution.org_name}
              </p>
            )}
          </div>

          <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
            <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>

        {/* Scholar count + departments */}
        <div className="mt-3.5 flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-800 leading-none">
                {institution.scholar_count}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                学者
              </span>
            </div>
          </div>

          {institution.departments.length > 0 && (
            <span className="text-[9px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap">
              {institution.departments.length} 院系
            </span>
          )}
        </div>
      </div>

      {/* Department chips */}
      {institution.departments.length > 0 && (
        <div className="px-5 pb-5 flex flex-wrap gap-1.5">
          {institution.departments.slice(0, 3).map((dept, i) => (
            <span
              key={dept.name}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${getDeptAccent(institution.id, i)}`}
            >
              {dept.name}
              {dept.scholar_count > 0 && (
                <span className="opacity-60">· {dept.scholar_count}</span>
              )}
            </span>
          ))}
          {institution.departments.length > 3 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] text-slate-400 bg-slate-50 font-medium">
              +{institution.departments.length - 3} 更多
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
}
