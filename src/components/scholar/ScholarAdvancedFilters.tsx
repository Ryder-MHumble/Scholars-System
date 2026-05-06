import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type {
  ChineseIdentityFilter,
  StudentIdentityFilter,
} from "@/utils/scholarIdentity";
import {
  ACHIEVEMENT_TAG_YEARS,
  VENUE_ACHIEVEMENT_TAG_OPTIONS,
  type AchievementTag,
  type AchievementTagToken,
  formatAchievementTagToken,
  parseAchievementTagToken,
} from "@/utils/scholarAchievementTags";

interface ScholarAdvancedFiltersProps {
  studentIdentity: StudentIdentityFilter;
  onChangeStudentIdentity: (value: StudentIdentityFilter) => void;
  chineseIdentity: ChineseIdentityFilter;
  onChangeChineseIdentity: (value: ChineseIdentityFilter) => void;
  achievementTags: AchievementTagToken[];
  onChangeAchievementTags: (value: AchievementTagToken[]) => void;
  onApplyQuickFilters: (filters: {
    studentIdentity?: StudentIdentityFilter;
    chineseIdentity?: ChineseIdentityFilter;
    achievementTags?: AchievementTagToken[];
  }) => void;
  activeCount: number;
  onReset: () => void;
}

interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
  onClear: () => void;
}

type FilterTab = "quick" | "identity" | "achievement";

const STUDENT_OPTIONS: StudentIdentityFilter[] = ["全部", "学生", "非学生"];
const CHINESE_OPTIONS: ChineseIdentityFilter[] = [
  "全部",
  "华人",
  "非华人",
  "待判定",
];
const COMMON_ACHIEVEMENT_TAGS: AchievementTag[] = [
  "ICML",
  "NeurIPS",
  "ICLR",
  "CVPR",
  "AAAI",
  "ACL",
  "EMNLP",
  "JMLR",
];

function hasValue(value: string): boolean {
  return Boolean(value && value !== "全部");
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function getVenueYearToken(
  tag: AchievementTag,
  year: number,
): AchievementTagToken {
  return `${tag}:${year}` as AchievementTagToken;
}

function removeVenueTokens(
  value: AchievementTagToken[],
  tag: AchievementTag,
): AchievementTagToken[] {
  return value.filter((token) => parseAchievementTagToken(token)?.tag !== tag);
}

export function ScholarAdvancedFilters({
  studentIdentity,
  onChangeStudentIdentity,
  chineseIdentity,
  onChangeChineseIdentity,
  achievementTags,
  onChangeAchievementTags,
  onApplyQuickFilters,
  activeCount,
  onReset,
}: ScholarAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("quick");
  const [quickQuery, setQuickQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFilters = useMemo(
    () => {
      const items: Array<ActiveFilterChip | null> = [
        hasValue(studentIdentity)
          ? {
              key: "student",
              label: "人员",
              value: studentIdentity,
              onClear: () => onChangeStudentIdentity("全部"),
            }
          : null,
        hasValue(chineseIdentity)
          ? {
              key: "chinese",
              label: "华人",
              value: chineseIdentity,
              onClear: () => onChangeChineseIdentity("全部"),
            }
          : null,
      ];
      const identityFilters = items.filter(
        (item): item is ActiveFilterChip => item !== null,
      );
      const achievementFilters = achievementTags.map((token) => ({
        key: `achievement-${token}`,
        label: "学术",
        value: formatAchievementTagToken(token),
        onClear: () =>
          onChangeAchievementTags(achievementTags.filter((item) => item !== token)),
      }));
      return [...identityFilters, ...achievementFilters];
    },
    [
      studentIdentity,
      chineseIdentity,
      achievementTags,
      onChangeStudentIdentity,
      onChangeChineseIdentity,
      onChangeAchievementTags,
    ],
  );

  const tabs: Array<{ id: FilterTab; label: string; count?: number }> = [
    { id: "quick", label: "快速" },
    { id: "identity", label: "身份", count: [studentIdentity, chineseIdentity].filter(hasValue).length },
    { id: "achievement", label: "学术", count: achievementTags.length },
  ];

  const toggleAchievementTag = (tag: AchievementTag) => {
    const nextTags = achievementTags.includes(tag)
      ? achievementTags.filter((item) => item !== tag)
      : [...removeVenueTokens(achievementTags, tag), tag];
    onChangeAchievementTags(nextTags);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const applyQuickQuery = () => {
    const tokens = quickQuery
      .split(/[\s,，、]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const shouldReset = tokens.some((token) =>
      ["全部", "清空", "reset"].includes(normalizeToken(token)),
    );
    if (shouldReset) {
      onReset();
      setQuickQuery("");
      return;
    }

    const nextFilters: {
      studentIdentity?: StudentIdentityFilter;
      chineseIdentity?: ChineseIdentityFilter;
      achievementTags?: AchievementTagToken[];
    } = {};
    const nextAchievementTags = new Set<AchievementTagToken>(achievementTags);

    for (const token of tokens) {
      const normalized = normalizeToken(token);

      if (["学生", "student"].includes(normalized)) {
        nextFilters.studentIdentity = "学生";
        continue;
      }
      if (["非学生", "notstudent", "nonstudent"].includes(normalized)) {
        nextFilters.studentIdentity = "非学生";
        continue;
      }
      if (["华人", "chinese"].includes(normalized)) {
        nextFilters.chineseIdentity = "华人";
        continue;
      }
      if (["非华人", "notchinese", "nonchinese"].includes(normalized)) {
        nextFilters.chineseIdentity = "非华人";
        continue;
      }
      if (["待判定", "未知", "unknown"].includes(normalized)) {
        nextFilters.chineseIdentity = "待判定";
        continue;
      }

      const achievement = parseAchievementTagToken(token);
      if (achievement) {
        if (achievement.year === null) {
          for (const existingToken of Array.from(nextAchievementTags)) {
            if (parseAchievementTagToken(existingToken)?.tag === achievement.tag) {
              nextAchievementTags.delete(existingToken);
            }
          }
        } else {
          nextAchievementTags.delete(achievement.tag);
        }
        nextAchievementTags.add(achievement.token);
        continue;
      }
    }
    if (nextAchievementTags.size !== achievementTags.length) {
      nextFilters.achievementTags = Array.from(nextAchievementTags);
    }
    if (Object.keys(nextFilters).length === 0) return;
    onApplyQuickFilters(nextFilters);
    setQuickQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
          isOpen || activeCount > 0
            ? "border-primary-300 bg-primary-50 text-primary-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
        )}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>筛选</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(600px,calc(100vw-24px))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(event) => setQuickQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyQuickQuery();
                  }}
                  placeholder="支持多关键词匹配，空格分隔后回车 示例：华人 学生 ICML:2025"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <button
                type="button"
                onClick={applyQuickQuery}
                disabled={!quickQuery.trim()}
                className={cn(
                  "h-9 rounded-lg px-3 text-sm font-semibold transition-colors",
                  quickQuery.trim()
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "cursor-not-allowed bg-gray-100 text-gray-300",
                )}
              >
                应用
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                aria-label="关闭筛选弹层"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-7 items-center gap-2">
              <span className="shrink-0 text-xs font-semibold text-gray-500">
                已选
              </span>
              {activeFilters.length === 0 ? (
                <span className="rounded-md border border-dashed border-gray-200 px-2 py-0.5 text-xs text-gray-400">
                  暂无筛选条件
                </span>
              ) : (
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                  {activeFilters.map((item) => (
                    <span
                      key={item.key}
                      className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-100"
                    >
                      <span className="text-primary-500">{item.label}</span>
                      <span className="max-w-32 truncate text-gray-800">
                        {item.value}
                      </span>
                      <button
                        type="button"
                        onClick={item.onClear}
                        className="grid h-4 w-4 place-items-center rounded text-primary-400 transition-colors hover:bg-primary-100 hover:text-primary-700"
                        aria-label={`清除${item.label}筛选`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={onReset}
                disabled={activeCount === 0}
                className={cn(
                  "ml-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                  activeCount === 0
                    ? "cursor-not-allowed text-gray-300"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                清空
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100 px-2.5 pt-2">
            <div className="flex rounded-lg bg-gray-50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative h-8 flex-1 rounded-md px-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-white text-primary-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-800",
                  )}
                >
                  <span>{tab.label}</span>
                  {Boolean(tab.count) && (
                    <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2.5">
            {activeTab === "quick" && (
              <QuickPanel
                studentIdentity={studentIdentity}
                chineseIdentity={chineseIdentity}
                achievementTags={achievementTags}
                onPickStudent={onChangeStudentIdentity}
                onPickChinese={onChangeChineseIdentity}
                onToggleAchievement={toggleAchievementTag}
              />
            )}

            {activeTab === "identity" && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                <OptionGroup
                  label="人员身份"
                  options={STUDENT_OPTIONS}
                  value={studentIdentity}
                  onChange={onChangeStudentIdentity}
                />
                <OptionGroup
                  label="华人身份"
                  options={CHINESE_OPTIONS}
                  value={chineseIdentity}
                  onChange={onChangeChineseIdentity}
                />
              </div>
            )}

            {activeTab === "achievement" && (
              <AchievementFilterSection
                value={achievementTags}
                onChange={onChangeAchievementTags}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickPanel({
  studentIdentity,
  chineseIdentity,
  achievementTags,
  onPickStudent,
  onPickChinese,
  onToggleAchievement,
}: {
  studentIdentity: StudentIdentityFilter;
  chineseIdentity: ChineseIdentityFilter;
  achievementTags: AchievementTagToken[];
  onPickStudent: (value: StudentIdentityFilter) => void;
  onPickChinese: (value: ChineseIdentityFilter) => void;
  onToggleAchievement: (value: AchievementTag) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-2.5">
        <OptionGroup
          label="身份快捷"
          options={STUDENT_OPTIONS}
          value={studentIdentity}
          onChange={onPickStudent}
        />
        <OptionGroup
          label="华人快捷"
          options={CHINESE_OPTIONS}
          value={chineseIdentity}
          onChange={onPickChinese}
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">常用学术标识</p>
          <span className="text-[11px] text-gray-400">也可直接输入</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {COMMON_ACHIEVEMENT_TAGS.map((tag) => (
            <AchievementOptionButton
              key={tag}
              option={tag}
              selected={achievementTags.includes(tag)}
              onToggle={onToggleAchievement}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <OptionButton
            key={option}
            option={option}
            value={value}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function AchievementFilterSection({
  value,
  onChange,
}: {
  value: AchievementTagToken[];
  onChange: (value: AchievementTagToken[]) => void;
}) {
  const initialVenue =
    value
      .map((token) => parseAchievementTagToken(token)?.tag)
      .find((tag): tag is AchievementTag => Boolean(tag)) ??
    VENUE_ACHIEVEMENT_TAG_OPTIONS[0];
  const [activeVenue, setActiveVenue] = useState<AchievementTag>(initialVenue);

  const toggleTag = (tag: AchievementTag) => {
    onChange(
      value.includes(tag)
        ? value.filter((item) => item !== tag)
        : [...removeVenueTokens(value, tag), tag],
    );
  };

  const toggleYear = (tag: AchievementTag, year: number) => {
    const token = getVenueYearToken(tag, year);
    onChange(
      value.includes(token)
        ? value.filter((item) => item !== token)
        : [...value.filter((item) => item !== tag), token],
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          aria-pressed={value.length === 0}
          className={cn(
            "inline-flex h-8 min-w-24 items-center justify-center gap-1 rounded-md border px-2.5 text-sm font-medium transition-colors",
            value.length === 0
              ? "border-primary-300 bg-primary-50 text-primary-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
          )}
        >
          <span className="truncate">不限</span>
          {value.length === 0 && <Check className="h-3.5 w-3.5 shrink-0" />}
        </button>
        <span className="text-[11px] text-gray-400">
          {value.length > 0 ? `已选 ${value.length} 项` : "未限制顶刊顶会"}
        </span>
      </div>
      <VenueYearSelector
        options={VENUE_ACHIEVEMENT_TAG_OPTIONS}
        activeVenue={activeVenue}
        onActiveVenueChange={setActiveVenue}
        value={value}
        onToggle={toggleTag}
        onToggleYear={toggleYear}
      />
    </div>
  );
}

function getVenueSelectedYears(
  value: AchievementTagToken[],
  tag: AchievementTag,
): number[] {
  return value
    .map((token) => parseAchievementTagToken(token))
    .filter(
      (token): token is { tag: AchievementTag; year: number; token: AchievementTagToken } =>
        token?.tag === tag && token.year !== null,
    )
    .map((token) => token.year);
}

function getVenueSelectionLabel(
  value: AchievementTagToken[],
  tag: AchievementTag,
): string {
  if (value.includes(tag)) return "全部";
  const years = getVenueSelectedYears(value, tag);
  return years.length > 0 ? `${years.length} 年` : "";
}

function VenueYearSelector<T extends AchievementTag>({
  options,
  activeVenue,
  onActiveVenueChange,
  value,
  onToggle,
  onToggleYear,
}: {
  options: readonly T[];
  activeVenue: T;
  onActiveVenueChange: (value: T) => void;
  value: AchievementTagToken[];
  onToggle: (value: T) => void;
  onToggleYear: (value: T, year: number) => void;
}) {
  const activeYears = ACHIEVEMENT_TAG_YEARS[activeVenue];
  const activeAllYearsSelected = value.includes(activeVenue);

  return (
    <div className="grid gap-3 sm:grid-cols-[176px_minmax(0,1fr)]">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-1">
        <div className="mb-1 flex items-center justify-between px-2 py-1">
          <p className="text-xs font-semibold text-gray-500">顶刊顶会</p>
          <span className="text-[11px] text-gray-400">{options.length} 项</span>
        </div>
        <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
          {options.map((option) => {
            const selectedLabel = getVenueSelectionLabel(value, option);
            const active = activeVenue === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onActiveVenueChange(option)}
                aria-pressed={active}
                className={cn(
                  "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-white text-primary-700 shadow-sm ring-1 ring-primary-100"
                    : "text-gray-600 hover:bg-white hover:text-gray-900",
                )}
              >
                <span className="truncate">{option}</span>
                {selectedLabel && (
                  <span className="shrink-0 rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">
                    {selectedLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="rounded-lg border border-gray-100 bg-white p-3"
        role="group"
        aria-label={`${activeVenue} 年份筛选`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {activeVenue}
            </p>
            <p className="text-[11px] text-gray-400">按论文年份筛选</p>
          </div>
          <button
            type="button"
            onClick={() => onToggle(activeVenue)}
            aria-pressed={activeAllYearsSelected}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border px-2.5 text-sm font-medium transition-colors",
              activeAllYearsSelected
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            全部年份
            {activeAllYearsSelected && <Check className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {activeYears.map((year) => {
            const token = getVenueYearToken(activeVenue, year);
            return (
              <YearOptionButton
                key={token}
                year={year}
                selected={value.includes(token)}
                onToggle={() => onToggleYear(activeVenue, year)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function YearOptionButton({
  year,
  selected,
  onToggle,
}: {
  year: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-7 min-w-0 items-center justify-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors",
        selected
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
      )}
    >
      <span className="truncate">{year}</span>
      {selected && <Check className="h-3 w-3 shrink-0" />}
    </button>
  );
}

function AchievementOptionButton<T extends AchievementTag>({
  option,
  selected,
  onToggle,
  compact = false,
}: {
  option: T;
  selected: boolean;
  onToggle: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(option)}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-1 rounded-md border px-2.5 text-sm font-medium transition-colors",
        compact ? "h-8" : "h-9",
        selected
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
      )}
    >
      <span className="truncate">{option}</span>
      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}

function OptionButton<T extends string>({
  option,
  value,
  onChange,
  className,
  compact = false,
}: {
  option: T;
  value: string;
  onChange: (value: T) => void;
  className?: string;
  compact?: boolean;
}) {
  const selected = value === option;
  return (
    <button
      type="button"
      onClick={() => onChange(option)}
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-1 rounded-md border px-2.5 text-sm font-medium transition-colors",
        compact ? "h-8" : "h-9",
        selected
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
        className,
      )}
    >
      <span className="truncate">{option}</span>
      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}
