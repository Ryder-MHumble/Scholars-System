import { motion } from "framer-motion";
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
