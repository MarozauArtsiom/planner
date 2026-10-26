import { hasSmRights } from "./permissions";

export const RETRO_TEMPLATES = [
  "WENT_WELL_TO_IMPROVE",
  "START_STOP_CONTINUE",
  "MAD_SAD_GLAD",
  "FOUR_LS",
  "SAILBOAT",
  "CUSTOM",
] as const;

export type RetroTemplate = (typeof RETRO_TEMPLATES)[number];

export const RETRO_PHASES = [
  "COLLECT",
  "GROUP",
  "VOTE",
  "DISCUSS",
  "ACTIONS",
  "COMPLETED",
] as const;

export type RetroPhase = (typeof RETRO_PHASES)[number];

export const RETRO_COLORS = [
  "emerald",
  "amber",
  "rose",
  "blue",
  "violet",
  "zinc",
] as const;

export type RetroColumnColor = (typeof RETRO_COLORS)[number];

export type RetroActionStatus = "OPEN" | "DONE";

export function isRetroTemplate(val: unknown): val is RetroTemplate {
  return (
    typeof val === "string" &&
    (RETRO_TEMPLATES as readonly string[]).includes(val)
  );
}

export function isRetroPhase(val: unknown): val is RetroPhase {
  return (
    typeof val === "string" && (RETRO_PHASES as readonly string[]).includes(val)
  );
}

export function isRetroColor(val: unknown): val is RetroColumnColor {
  return (
    typeof val === "string" && (RETRO_COLORS as readonly string[]).includes(val)
  );
}

export interface DefaultColumnDef {
  titleKey: string;
  fallbackTitle: string;
  color: RetroColumnColor;
}

export const TEMPLATE_COLUMNS: Record<RetroTemplate, DefaultColumnDef[]> = {
  WENT_WELL_TO_IMPROVE: [
    {
      titleKey: "colWentWell",
      fallbackTitle: "Went well",
      color: "emerald",
    },
    {
      titleKey: "colToImprove",
      fallbackTitle: "To improve",
      color: "rose",
    },
    {
      titleKey: "colActionIdeas",
      fallbackTitle: "Action ideas",
      color: "blue",
    },
  ],
  START_STOP_CONTINUE: [
    {
      titleKey: "colStart",
      fallbackTitle: "Start doing",
      color: "emerald",
    },
    {
      titleKey: "colStop",
      fallbackTitle: "Stop doing",
      color: "rose",
    },
    {
      titleKey: "colContinue",
      fallbackTitle: "Continue doing",
      color: "blue",
    },
  ],
  MAD_SAD_GLAD: [
    {
      titleKey: "colMad",
      fallbackTitle: "Mad",
      color: "rose",
    },
    {
      titleKey: "colSad",
      fallbackTitle: "Sad",
      color: "amber",
    },
    {
      titleKey: "colGlad",
      fallbackTitle: "Glad",
      color: "emerald",
    },
  ],
  FOUR_LS: [
    {
      titleKey: "colLiked",
      fallbackTitle: "Liked",
      color: "emerald",
    },
    {
      titleKey: "colLearned",
      fallbackTitle: "Learned",
      color: "blue",
    },
    {
      titleKey: "colLacked",
      fallbackTitle: "Lacked",
      color: "rose",
    },
    {
      titleKey: "colLongedFor",
      fallbackTitle: "Longed for",
      color: "violet",
    },
  ],
  SAILBOAT: [
    {
      titleKey: "colWind",
      fallbackTitle: "Wind (Speeds us up)",
      color: "emerald",
    },
    {
      titleKey: "colAnchor",
      fallbackTitle: "Anchor (Slows us down)",
      color: "rose",
    },
    {
      titleKey: "colRocks",
      fallbackTitle: "Rocks (Risks ahead)",
      color: "amber",
    },
    {
      titleKey: "colIsland",
      fallbackTitle: "Island (Our goal)",
      color: "blue",
    },
  ],
  CUSTOM: [
    {
      titleKey: "colWentWell",
      fallbackTitle: "Column 1",
      color: "emerald",
    },
    {
      titleKey: "colToImprove",
      fallbackTitle: "Column 2",
      color: "amber",
    },
  ],
};

/**
 * Checks whether a user has facilitator privileges on a RetroBoard:
 * - Board creator
 * - Project owner or Scrum Master
 */
export function canFacilitateRetro(
  userId: string,
  board?: { createdById: string } | null,
  membership?: { isScrumMaster: boolean } | null,
  project?: { ownerId: string } | null,
): boolean {
  if (!userId) return false;
  if (board?.createdById === userId) return true;
  return hasSmRights(userId, membership, project);
}

/**
 * Replaces characters of unrevealed cards so text cannot be snooped in DevTools
 * while preserving visual word lengths for the blur effect.
 */
export function maskCardContent(content: string): string {
  return content.replace(/[^\s]/g, "•");
}

/** Participant is considered online if they polled within the last 15 seconds. */
export const RETRO_ONLINE_THRESHOLD_MS = 15_000;

/** TTL for guest accounts created when joining a retro board via invite link: 48 hours. */
export const RETRO_GUEST_TTL_MS = 48 * 60 * 60 * 1000;

export function retroGuestExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RETRO_GUEST_TTL_MS);
}
