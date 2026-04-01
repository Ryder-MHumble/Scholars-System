import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import type { LeadershipMember } from "@/types/institution";
import { Tag } from "./InstitutionBadges";

const AVATAR_COLORS = [
  "bg-blue-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-amber-400",
  "bg-teal-400",
  "bg-indigo-400",
  "bg-pink-400",
];

export function PersonAvatar({ name }: { name: string }) {
  const char = name.trim().charAt(0);
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <div
      className={`w-9 h-9 ${AVATAR_COLORS[h % AVATAR_COLORS.length]} rounded-full flex items-center justify-center shrink-0`}
    >
      <span className="text-white text-sm font-bold leading-none">{char}</span>
    </div>
  );
}

function getLeaderSnippet(leader: LeadershipMember): string {
  const intro = (leader.intro_lines || []).map((line) => line.trim()).find((line) => line);
  const raw = (intro || leader.bio || "").replace(/\s+/g, " ").trim();
  if (!raw) return "暂无简介";
  return raw;
}

function LeaderAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const [errored, setErrored] = useState(false);
  if (!avatarUrl || errored) {
    const char = name.trim().charAt(0) || "?";
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return (
      <div
        className={`w-full h-full ${AVATAR_COLORS[h % AVATAR_COLORS.length]} rounded-xl flex items-center justify-center shrink-0`}
      >
        <span className="text-white text-[30px] font-bold leading-none">{char}</span>
      </div>
    );
  }
  return (
    <img
      src={avatarUrl}
      alt={name}
      className="w-full h-full rounded-xl object-cover shrink-0 border border-slate-200 bg-white"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
    />
  );
}

export function TagList({ items }: { items: string[] }) {
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

export function PersonList({
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

export function LeadershipCardList({ leaders }: { leaders: LeadershipMember[] }) {
  if (!leaders.length) {
    return <p className="text-sm text-slate-400 italic">暂无院领导数据</p>;
  }

  const renderCardContent = (leader: LeadershipMember) => (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 min-h-[108px]">
      <div className="h-full py-0.5">
        <LeaderAvatar name={leader.name} avatarUrl={leader.avatar_url} />
      </div>
      <div className="min-w-0 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-slate-800 leading-tight truncate">
              {leader.name}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-blue-700 line-clamp-1">{leader.role}</p>
          </div>
          {leader.profile_url ? (
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
              <ExternalLink className="w-3 h-3" />
              点击查看主页
            </div>
          ) : null}
        </div>

        <p className="mt-1.5 text-[12px] leading-5 text-slate-600 break-words overflow-hidden line-clamp-3 flex-1">
          {getLeaderSnippet(leader)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {leaders.map((leader, i) => (
        leader.profile_url ? (
          <motion.a
            key={`${leader.name}-${leader.role}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            href={leader.profile_url}
            target="_blank"
            rel="noreferrer"
            title="点击查看个人主页"
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:bg-white hover:shadow-md transition-all cursor-pointer"
          >
            {renderCardContent(leader)}
          </motion.a>
        ) : (
          <motion.article
            key={`${leader.name}-${leader.role}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
          >
            {renderCardContent(leader)}
          </motion.article>
        )
      ))}
    </div>
  );
}
