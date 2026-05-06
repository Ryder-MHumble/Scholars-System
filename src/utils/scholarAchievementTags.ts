export const VENUE_ACHIEVEMENT_TAG_OPTIONS = [
  "JMLR",
  "JAIR",
  "TMLR",
  "ACL",
  "EMNLP",
  "ICLR",
  "ICML",
  "NeurIPS",
  "CVPR",
  "ICCV",
  "ECCV",
  "AAAI",
  "IJCAI",
] as const;

export const COMPETITION_ACHIEVEMENT_TAG_OPTIONS = [] as const;

export const ACHIEVEMENT_TAG_OPTIONS = [
  ...VENUE_ACHIEVEMENT_TAG_OPTIONS,
  ...COMPETITION_ACHIEVEMENT_TAG_OPTIONS,
] as const;

export type AchievementTag = (typeof ACHIEVEMENT_TAG_OPTIONS)[number];
export type AchievementTagToken = AchievementTag | `${AchievementTag}:${number}`;
export type AchievementTagFilter = "全部" | AchievementTag;
export type AchievementTagKind = "venue" | "competition";

export const ACHIEVEMENT_TAG_YEARS: Record<AchievementTag, readonly number[]> = {
  JMLR: [2023, 2024, 2025],
  JAIR: [2023, 2024, 2025],
  TMLR: [2023, 2024, 2025],
  ACL: [2024, 2025],
  EMNLP: [2023, 2024, 2025],
  ICLR: [2024, 2025],
  ICML: [2023, 2024, 2025],
  NeurIPS: [2022, 2023, 2024],
  CVPR: [2023, 2024, 2025],
  ICCV: [2023, 2025],
  ECCV: [2022, 2024],
  AAAI: [2024, 2025, 2026],
  IJCAI: [2023, 2024, 2025],
};

type PublicationLike = {
  venue?: unknown;
  conference?: unknown;
  journal?: unknown;
  venue_name?: unknown;
  publication_venue?: unknown;
  booktitle?: unknown;
  title?: unknown;
  year?: unknown;
};

type AwardLike = {
  title?: unknown;
  level?: unknown;
  grantor?: unknown;
  description?: unknown;
  year?: unknown;
};

export interface AchievementTagSource {
  achievement_tags?: unknown;
  representative_publications?: PublicationLike[];
  awards?: AwardLike[];
}

const TAG_MATCHERS: Array<{ tag: AchievementTag; patterns: RegExp[] }> = [
  {
    tag: "JMLR",
    patterns: [/\bJMLR\b/, /JOURNAL OF MACHINE LEARNING RESEARCH/],
  },
  {
    tag: "JAIR",
    patterns: [/\bJAIR\b/, /JOURNAL OF ARTIFICIAL INTELLIGENCE RESEARCH/],
  },
  {
    tag: "TMLR",
    patterns: [/\bTMLR\b/, /TRANSACTIONS ON MACHINE LEARNING RESEARCH/],
  },
  {
    tag: "ACL",
    patterns: [/\bACL\b/, /ASSOCIATION FOR COMPUTATIONAL LINGUISTICS/],
  },
  {
    tag: "EMNLP",
    patterns: [/\bEMNLP\b/, /EMPIRICAL METHODS IN NATURAL LANGUAGE PROCESSING/],
  },
  {
    tag: "ICLR",
    patterns: [/\bICLR\b/, /INTERNATIONAL CONFERENCE ON LEARNING REPRESENTATIONS/],
  },
  {
    tag: "ICML",
    patterns: [/\bICML\b/, /INTERNATIONAL CONFERENCE ON MACHINE LEARNING/],
  },
  {
    tag: "NeurIPS",
    patterns: [/\bNEURIPS\b/, /\bNIPS\b/, /NEURAL INFORMATION PROCESSING SYSTEMS/],
  },
  {
    tag: "CVPR",
    patterns: [/\bCVPR\b/, /COMPUTER VISION AND PATTERN RECOGNITION/],
  },
  {
    tag: "ICCV",
    patterns: [/\bICCV\b/, /INTERNATIONAL CONFERENCE ON COMPUTER VISION/],
  },
  {
    tag: "ECCV",
    patterns: [/\bECCV\b/, /EUROPEAN CONFERENCE ON COMPUTER VISION/],
  },
  {
    tag: "AAAI",
    patterns: [/\bAAAI\b/, /AAAI CONFERENCE ON ARTIFICIAL INTELLIGENCE/],
  },
  {
    tag: "IJCAI",
    patterns: [/\bIJCAI\b/, /INTERNATIONAL JOINT CONFERENCE ON ARTIFICIAL INTELLIGENCE/],
  },
];

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/&/g, " AND ")
    .replace(/\+/g, " PLUS ")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function addMatchesFromText(text: unknown, result: Set<AchievementTag>): void {
  const normalized = normalizeText(text);
  if (!normalized) return;
  for (const { tag, patterns } of TAG_MATCHERS) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      result.add(tag);
    }
  }
}

function normalizeRawAchievementTag(value: unknown): AchievementTag | null {
  const result = new Set<AchievementTag>();
  addMatchesFromText(value, result);
  return [...result][0] ?? null;
}

export function parseAchievementTagToken(
  value: unknown,
): { tag: AchievementTag; year: number | null; token: AchievementTagToken } | null {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return null;
  const match = rawValue.match(/^(.+?)[：:](\d{4})$/);
  const tag = normalizeRawAchievementTag(match ? match[1] : rawValue);
  if (!tag) return null;
  const year = match ? Number(match[2]) : null;
  if (year !== null && !ACHIEVEMENT_TAG_YEARS[tag].includes(year)) {
    return null;
  }
  return {
    tag,
    year,
    token: (year === null ? tag : `${tag}:${year}`) as AchievementTagToken,
  };
}

export function formatAchievementTagToken(token: AchievementTagToken): string {
  const parsed = parseAchievementTagToken(token);
  if (!parsed) return token;
  return parsed.year === null ? parsed.tag : `${parsed.tag} ${parsed.year}`;
}

export function getAchievementTagKind(tag: AchievementTag): AchievementTagKind {
  return (COMPETITION_ACHIEVEMENT_TAG_OPTIONS as readonly string[]).includes(tag)
    ? "competition"
    : "venue";
}

export function extractAchievementTags(
  source: AchievementTagSource,
): AchievementTag[] {
  const result = new Set<AchievementTag>();
  const rawTags = source.achievement_tags;

  if (Array.isArray(rawTags)) {
    for (const rawTag of rawTags) {
      const tag = normalizeRawAchievementTag(rawTag);
      if (tag) result.add(tag);
    }
  } else if (typeof rawTags === "string") {
    const tag = normalizeRawAchievementTag(rawTags);
    if (tag) result.add(tag);
  }

  for (const publication of source.representative_publications ?? []) {
    addMatchesFromText(
      [
        publication.venue,
        publication.conference,
        publication.journal,
        publication.venue_name,
        publication.publication_venue,
        publication.booktitle,
      ]
        .filter(Boolean)
        .join(" "),
      result,
    );
  }

  return ACHIEVEMENT_TAG_OPTIONS.filter((tag) => result.has(tag));
}

export function matchesAchievementTag(
  source: AchievementTagSource,
  filter: AchievementTagFilter,
): boolean {
  if (filter === "全部") return true;
  return extractAchievementTags(source).includes(filter);
}
