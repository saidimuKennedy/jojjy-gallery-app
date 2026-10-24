/**
 * Semantic experience state for a Music release.
 *
 * Presentation (light discovery vs black acquired) is driven by the viewer's
 * RELATIONSHIP to the release — not by whether the release merely has a price.
 *
 * Precedence:
 *   ReleaseUnlock (permanent)   → OWNED   (wins over temporary access)
 *   active Membership (no unlock)→ STUDIO
 *   otherwise                   → DISCOVERY
 */
export type ReleaseExperience = "DISCOVERY" | "OWNED" | "STUDIO";

export type ViewerAccessLike =
  | {
      owned?: boolean | null;
      isStudioMember?: boolean | null;
    }
  | null
  | undefined;

export function releaseExperience(access: ViewerAccessLike): ReleaseExperience {
  if (access?.owned) return "OWNED";
  if (access?.isStudioMember) return "STUDIO";
  return "DISCOVERY";
}

/** Black acquired environment vs light discovery environment. */
export function experienceTone(
  experience: ReleaseExperience
): "light" | "dark" {
  return experience === "DISCOVERY" ? "light" : "dark";
}
