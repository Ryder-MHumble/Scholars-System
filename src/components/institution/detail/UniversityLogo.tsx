import { useState } from "react";
import { Edit2 } from "lucide-react";
import { getLogoSrc, getGradient } from "@/utils/institutionLogoUtils";

export function UniversityLogo({
  name,
  id,
  avatar,
  onEditAvatar,
}: {
  name: string;
  id: string;
  avatar?: string | null;
  onEditAvatar?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const effectiveSrc = avatar || getLogoSrc(name);
  const gradient = getGradient(id);
  const initial = name.trim().charAt(0);

  const wrapperClass =
    "relative w-24 h-24 rounded-3xl shrink-0 shadow-xl group cursor-pointer";

  const overlay = onEditAvatar ? (
    <div
      onClick={onEditAvatar}
      className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
    >
      <Edit2 className="w-6 h-6 text-white" />
    </div>
  ) : null;

  if (effectiveSrc && !imgFailed) {
    return (
      <div
        className={`${wrapperClass} bg-white border-2 border-slate-100 flex items-center justify-center overflow-hidden p-2.5`}
      >
        <img
          src={effectiveSrc}
          alt={`${name} logo`}
          className="w-full h-full object-contain"
          onError={() => setImgFailed(true)}
        />
        {overlay}
      </div>
    );
  }

  return (
    <div
      className={`${wrapperClass} bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      <span className="text-white text-4xl font-black leading-none">
        {initial}
      </span>
      {overlay}
    </div>
  );
}
