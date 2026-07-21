export type ImagePreset = "thumb" | "card" | "hero" | "full";

const PRESETS: Record<ImagePreset, { w?: number; q?: string }> = {
  thumb: { w: 400, q: "auto" },
  card: { w: 800, q: "auto" },
  hero: { w: 1600, q: "auto" },
  full: { q: "auto" },
};

export const SITE_LOGO_URL =
  "https://res.cloudinary.com/dq3wkbgts/image/upload/v1751641327/logo_v51aad.png";

function hasTransformSegment(url: string): boolean {
  const afterUpload = url.split("/upload/")[1];
  if (!afterUpload) return false;
  const firstSegment = afterUpload.split("/")[0] ?? "";
  return firstSegment.includes(",");
}

/** Apply Cloudinary f_auto / q_auto / w_* transforms for faster delivery. */
export function cloudinaryUrl(
  url: string,
  preset: ImagePreset = "full"
): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  if (!url.includes("/upload/")) return url;
  if (hasTransformSegment(url)) return url;

  const { w, q = "auto" } = PRESETS[preset];
  const transform = w ? `f_auto,q_${q},w_${w}` : `f_auto,q_${q}`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

/** Prefer thumbnail URL, fall back to main URL, then apply preset. */
export function pickImageUrl(
  primary: string | null | undefined,
  fallback?: string | null,
  preset: ImagePreset = "card"
): string {
  const raw = primary || fallback || "";
  return raw ? cloudinaryUrl(raw, preset) : "";
}

/** Generate a thumbnail transform URL from a full image URL. */
export function thumbnailFromUrl(
  url: string,
  preset: ImagePreset = "thumb"
): string {
  return cloudinaryUrl(url, preset);
}

export const IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg==";

export const PRESET_SIZES: Record<ImagePreset, string> = {
  thumb: "80px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  hero: "(max-width: 768px) 100vw, 1400px",
  full: "100vw",
};
