import { Heart, Share2, Eye, Building2 } from 'lucide-react';
import { getAvatarColor, getInitial } from '@/utils/avatar';
import { VerificationBadge } from '../shared/VerificationBadge';
import type { Scholar } from '@/types';
import { cn } from '@/utils/cn';

interface ScholarHeaderBannerProps {
  scholar: Scholar;
  universityName: string;
  className?: string;
}

export function ScholarHeaderBanner({
  scholar,
  universityName,
  className,
}: ScholarHeaderBannerProps) {
  const avatarColor = getAvatarColor(scholar.name);
  const initial = getInitial(scholar.name);

  return (
    <div
      className={cn(
        'relative bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-2xl overflow-hidden',
        className,
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-white rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative px-8 py-8 flex flex-col lg:flex-row items-start lg:items-center gap-6">
        {/* Avatar Section */}
        <div className="relative flex-shrink-0">
          {scholar.profileImageUrl ? (
            <img
              src={scholar.profileImageUrl}
              alt={scholar.name}
              className="w-36 h-36 rounded-2xl object-cover border-4 border-white shadow-xl"
            />
          ) : (
            <div
              className={cn(
                'w-36 h-36 rounded-2xl flex items-center justify-center text-5xl font-bold text-white border-4 border-white shadow-xl',
                avatarColor,
              )}
            >
              {initial}
            </div>
          )}
          {/* Verification Badge Overlay */}
          {(scholar.verified || scholar.claimed) && (
            <div className="absolute -bottom-2 -right-2">
              <VerificationBadge
                verified={scholar.verified}
                claimed={scholar.claimed}
                size="md"
                className="shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Name and Title */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">
              {scholar.name}
              {scholar.nameEn && (
                <span className="ml-3 text-2xl font-normal text-white/80">
                  ({scholar.nameEn})
                </span>
              )}
            </h1>
            <p className="text-xl text-white/90 font-medium">{scholar.title}</p>
          </div>

          {/* Institution */}
          <div className="flex items-center gap-2 text-white/90">
            <Building2 className="w-5 h-5" />
            <span className="text-base font-medium">{universityName}</span>
          </div>

          {/* View Counter */}
          {scholar.profileViews && (
            <div className="flex items-center gap-2 text-white/80">
              <Eye className="w-4.5 h-4.5" />
              <span className="text-sm">
                {scholar.profileViews.toLocaleString()} views
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex lg:flex-col gap-3">
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-colors border border-white/20"
            title="关注学者"
          >
            <Heart className="w-4.5 h-4.5" />
            <span className="text-sm font-medium hidden sm:inline">Follow</span>
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-colors border border-white/20"
            title="分享"
          >
            <Share2 className="w-4.5 h-4.5" />
            <span className="text-sm font-medium hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
