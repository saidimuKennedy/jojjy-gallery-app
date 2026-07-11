import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import useSWR from "swr";
import { APIResponse, MediaBlogEntryWithRelations } from "@/types/api";

type EntryKind =
  | "video"
  | "images"
  | "audio"
  | "blog_post"
  | "external_link"
  | "unknown";

interface ArchiveEntry {
  id: number;
  type: EntryKind;
  title: string;
  shortDesc: string;
  thumbnail?: string;
  images?: string[];
  duration?: string;
  year?: string;
  content?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch data");
  }
  return res.json();
};

const CATALOGUE_LABEL: Record<Exclude<EntryKind, "unknown">, string> = {
  video: "Film",
  images: "Photograph",
  audio: "Sound",
  blog_post: "Essay",
  external_link: "Note",
};

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease },
  },
};

function getHeroImage(item: ArchiveEntry): string | undefined {
  if (item.type === "images" && item.images?.length) return item.images[0];
  return item.thumbnail;
}

function rhythmPadding(index: number): string {
  const pads = [
    "pt-16 pb-24 md:pt-24 md:pb-36",
    "pt-20 pb-28 md:pt-32 md:pb-44",
    "pt-14 pb-24 md:pt-20 md:pb-36",
    "pt-24 pb-32 md:pt-36 md:pb-48",
  ];
  return pads[index % pads.length];
}

function layoutMode(
  item: ArchiveEntry,
  index: number
): "hero" | "essay" | "offset" {
  if (item.type === "blog_post" || item.type === "external_link") return "essay";
  if (item.type === "audio") return "essay";
  if (index % 3 === 1) return "offset";
  return "hero";
}

const ArchivePage = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const {
    data: apiResponse,
    error,
    isLoading,
  } = useSWR<APIResponse<MediaBlogEntryWithRelations[]>>(
    "/api/media-blog?limit=100",
    fetcher
  );

  const fetchedMediaEntries = apiResponse?.data || [];

  const mediaItems: ArchiveEntry[] = useMemo(
    () =>
      fetchedMediaEntries
        .map((entry) => {
          const year = entry.createdAt
            ? new Date(entry.createdAt).getFullYear().toString()
            : undefined;

          const transformedItem: ArchiveEntry = {
            id: entry.id,
            title: entry.title,
            shortDesc: entry.shortDesc || "",
            type: "unknown",
            year,
            content: entry.content || undefined,
          };

          switch (String(entry.type)) {
            case "VIDEO":
              transformedItem.type = "video";
              transformedItem.thumbnail =
                entry.thumbnailUrl ||
                entry.mediaFiles?.find(
                  (f) =>
                    String(f.type) === "VIDEO" || String(f.type) === "IMAGE"
                )?.url ||
                undefined;
              transformedItem.duration = entry.duration || "";
              break;
            case "IMAGES":
              transformedItem.type = "images";
              transformedItem.images = (entry.mediaFiles ?? [])
                .filter((f) => String(f.type) === "IMAGE")
                .map((f) => f.url);
              transformedItem.thumbnail =
                entry.thumbnailUrl || transformedItem.images[0];
              break;
            case "AUDIO":
              transformedItem.type = "audio";
              transformedItem.duration = entry.duration || "";
              transformedItem.thumbnail = entry.thumbnailUrl || undefined;
              break;
            case "BLOG_POST":
              transformedItem.type = "blog_post";
              transformedItem.thumbnail = entry.thumbnailUrl || undefined;
              break;
            case "EXTERNAL_LINK":
              transformedItem.type = "external_link";
              transformedItem.thumbnail = entry.thumbnailUrl || undefined;
              break;
            default:
              transformedItem.type = "unknown";
              break;
          }
          return transformedItem;
        })
        .filter((item) =>
          ["video", "images", "audio", "blog_post", "external_link"].includes(
            item.type
          )
        ),
    [fetchedMediaEntries]
  );

  // Prefer a visual piece to open on; keep it in the list flow as entrance only
  const openingIndex = Math.max(
    0,
    mediaItems.findIndex((item) => !!getHeroImage(item))
  );
  const opening = mediaItems[openingIndex] || null;
  const rest = opening
    ? mediaItems.filter((_, i) => i !== openingIndex)
    : mediaItems;

  useEffect(() => {
    document.documentElement.classList.add("archive-page");
    return () => document.documentElement.classList.remove("archive-page");
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a]">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
            Loading
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a]">
        <Navbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl">Unable to open the archive</p>
        </div>
        <Footer />
      </div>
    );
  }

  const openingHero = opening ? getHeroImage(opening) : undefined;
  const openingLabel =
    opening && opening.type !== "unknown"
      ? CATALOGUE_LABEL[opening.type]
      : "";

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <Navbar />

      <main>
        {mediaItems.length === 0 ? (
          <div className="px-6 py-40 text-center md:px-12">
            <p className="font-display text-xl text-[#8a8a8a]">
              The archive is empty for now.
            </p>
          </div>
        ) : (
          <>
            {/*
              Entrance as museum wall — not portfolio hero.
              White margins, caption below the image, no dark overlay title.
            */}
            {opening && openingHero && (
              <section className="px-0 pt-8 md:pt-12">
                <div className="px-6 md:px-12 lg:px-20">
                  <motion.p
                    className="font-display text-xs uppercase tracking-[0.32em] text-[#8a8a8a]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, ease }}
                  >
                    Archive
                  </motion.p>
                  <motion.p
                    className="mt-3 max-w-sm text-sm font-light leading-relaxed text-[#6b6b6b]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.1, ease }}
                  >
                    Traces of a life spent making work.
                  </motion.p>
                </div>

                <motion.div
                  className="mt-10 md:mt-14"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease }}
                >
                  <Link
                    href={`/gallery/${opening.id}`}
                    className="group block outline-none focus-visible:ring-1 focus-visible:ring-[#1a1a1a]/40"
                    onMouseEnter={() => setHoveredId(opening.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="archive-media mx-auto max-w-[1600px] overflow-hidden bg-[#f5f5f5] px-0 md:px-8 lg:px-16">
                      <img
                        src={openingHero}
                        alt={opening.title}
                        className="aspect-[16/10] w-full object-cover transition-transform duration-[800ms] ease-in-out group-hover:scale-[1.015] md:aspect-[21/9]"
                      />
                    </div>

                    <div className="mx-auto max-w-3xl px-6 pt-8 md:px-12 md:pt-10">
                      <p className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
                        {openingLabel}
                        {opening.year ? ` · ${opening.year}` : ""}
                        {opening.duration ? ` · ${opening.duration}` : ""}
                      </p>
                      <h1 className="mt-3 font-display text-3xl font-light leading-[1.08] tracking-tight text-[#1a1a1a] md:text-4xl lg:text-5xl">
                        {opening.title}
                      </h1>
                      {opening.shortDesc && (
                        <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-[#6b6b6b]">
                          {opening.shortDesc.length > 140
                            ? `${opening.shortDesc.slice(0, 140).trim()}…`
                            : opening.shortDesc}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>

                <div
                  className="mx-auto mt-20 h-px w-8 bg-neutral-200 md:mt-28"
                  aria-hidden
                />
              </section>
            )}

            {rest.map((item, index) => {
              const mode = layoutMode(item, index);
              const label =
                item.type !== "unknown" ? CATALOGUE_LABEL[item.type] : "";
              const hero = getHeroImage(item);
              const isHovered = hoveredId === item.id;

              return (
                <motion.article
                  key={item.id}
                  variants={reveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-10% 0px" }}
                  className={rhythmPadding(index)}
                >
                  {mode === "hero" && (
                    <Link
                      href={`/gallery/${item.id}`}
                      className="group block outline-none focus-visible:ring-1 focus-visible:ring-[#1a1a1a]/40"
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {hero && (
                        <div className="archive-media mx-auto max-w-[1400px] overflow-hidden bg-[#f5f5f5] md:px-8 lg:px-16">
                          <img
                            src={hero}
                            alt={item.title}
                            className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.02] md:aspect-[2/1]"
                            style={{
                              transform: isHovered ? "scale(1.02)" : "scale(1)",
                            }}
                          />
                        </div>
                      )}
                      <div className="mx-auto max-w-3xl px-6 pt-8 md:px-12 md:pt-10">
                        <span className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
                          {label}
                          {item.year ? ` · ${item.year}` : ""}
                        </span>
                        <h2 className="mt-3 font-display text-3xl font-light leading-[1.05] tracking-tight text-[#1a1a1a] md:text-4xl">
                          {item.title}
                        </h2>
                        {item.shortDesc && (
                          <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-[#6b6b6b]">
                            {item.shortDesc}
                          </p>
                        )}
                      </div>
                    </Link>
                  )}

                  {mode === "offset" && (
                    <Link
                      href={`/gallery/${item.id}`}
                      className="group block outline-none focus-visible:ring-1 focus-visible:ring-[#1a1a1a]/40"
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="grid items-end gap-10 px-6 md:grid-cols-12 md:gap-8 md:px-12 lg:px-20">
                        <div className="md:col-span-8 lg:col-span-9">
                          {hero && (
                            <div className="archive-media overflow-hidden bg-[#f5f5f5]">
                              <img
                                src={hero}
                                alt={item.title}
                                className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-in-out md:aspect-[16/10]"
                                style={{
                                  transform: isHovered
                                    ? "scale(1.02)"
                                    : "scale(1)",
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-4 lg:col-span-3 md:pb-4">
                          <span className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
                            {label}
                            {item.year ? ` · ${item.year}` : ""}
                          </span>
                          <h2 className="mt-3 font-display text-2xl font-light leading-tight tracking-tight text-[#1a1a1a] md:text-3xl">
                            {item.title}
                          </h2>
                          {item.shortDesc && (
                            <p className="mt-3 text-sm font-light leading-relaxed text-[#6b6b6b]">
                              {item.shortDesc}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}

                  {mode === "essay" && (
                    <Link
                      href={`/gallery/${item.id}`}
                      className="group mx-auto block max-w-3xl px-6 outline-none focus-visible:ring-1 focus-visible:ring-[#1a1a1a]/40 md:px-12"
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <span className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
                        {label}
                        {item.year ? ` · ${item.year}` : ""}
                      </span>
                      <h2 className="mt-4 font-display text-3xl font-light leading-[1.08] tracking-tight text-[#1a1a1a] md:text-4xl">
                        {item.title}
                      </h2>
                      {item.shortDesc && (
                        <p className="mt-5 text-sm font-light leading-relaxed text-[#5a5a5a]">
                          {item.shortDesc}
                        </p>
                      )}
                      {hero && (
                        <div className="archive-media mt-12 overflow-hidden bg-[#f5f5f5]">
                          <img
                            src={hero}
                            alt=""
                            className="aspect-[16/9] w-full object-cover transition-transform duration-700 ease-in-out"
                            style={{
                              transform: isHovered ? "scale(1.02)" : "scale(1)",
                            }}
                          />
                        </div>
                      )}
                      <span
                        className="mt-8 inline-block font-display text-xs uppercase tracking-[0.28em] text-[#1a1a1a] transition-opacity duration-500"
                        style={{ opacity: isHovered ? 1 : 0.45 }}
                      >
                        {item.type === "blog_post" ? "Read" : "Open"}
                      </span>
                    </Link>
                  )}
                </motion.article>
              );
            })}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ArchivePage;
