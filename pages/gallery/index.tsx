import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import useSWR from "swr";
import { APIResponse, MediaBlogEntryWithRelations } from "@/types/api";
import { MediaBlogEntryType, MediaFileType } from "@prisma/client";

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

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function getHeroImage(item: ArchiveEntry): string | undefined {
  if (item.type === "images" && item.images?.length) return item.images[0];
  return item.thumbnail;
}

function rhythmPadding(index: number): string {
  const pads = [
    "pt-16 pb-32 md:pt-24 md:pb-48",
    "pt-24 pb-40 md:pt-40 md:pb-56",
    "pt-20 pb-28 md:pt-28 md:pb-44",
    "pt-32 pb-48 md:pt-48 md:pb-64",
  ];
  return pads[index % pads.length];
}

function layoutMode(item: ArchiveEntry, index: number): "hero" | "essay" | "offset" {
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

  const mediaItems: ArchiveEntry[] = fetchedMediaEntries
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

      switch (entry.type) {
        case MediaBlogEntryType.VIDEO:
          transformedItem.type = "video";
          transformedItem.thumbnail =
            entry.thumbnailUrl ||
            entry.mediaFiles?.find((f) => f.type === MediaFileType.VIDEO)
              ?.url ||
            undefined;
          transformedItem.duration = entry.duration || "";
          break;
        case MediaBlogEntryType.IMAGES:
          transformedItem.type = "images";
          transformedItem.images = (entry.mediaFiles ?? [])
            .filter((f) => f.type === MediaFileType.IMAGE)
            .map((f) => f.url);
          transformedItem.thumbnail =
            entry.thumbnailUrl || transformedItem.images[0];
          break;
        case MediaBlogEntryType.AUDIO:
          transformedItem.type = "audio";
          transformedItem.duration = entry.duration || "";
          transformedItem.thumbnail = entry.thumbnailUrl || undefined;
          break;
        case MediaBlogEntryType.BLOG_POST:
          transformedItem.type = "blog_post";
          transformedItem.thumbnail = entry.thumbnailUrl || undefined;
          break;
        case MediaBlogEntryType.EXTERNAL_LINK:
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
    );

  useEffect(() => {
    document.documentElement.classList.add("archive-page");
    return () => document.documentElement.classList.remove("archive-page");
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a]">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="font-display text-lg tracking-wide text-[#8a8a8a]">
            Loading archive…
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
          <p className="font-display text-2xl text-[#1a1a1a]">
            Unable to open the archive
          </p>
          <p className="mt-3 max-w-md font-light text-sm text-[#8a8a8a]">
            {typeof error === "object" && error !== null && "message" in error
              ? String((error as Error).message)
              : String(error)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <Navbar />

      {/* Quiet entrance — one composition */}
      <header className="px-6 pb-8 pt-20 md:px-12 md:pb-12 md:pt-28 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
            Njenga Ngugi
          </p>
          <h1 className="mt-6 font-display text-6xl font-light leading-[0.95] tracking-tight text-[#1a1a1a] md:text-7xl lg:text-[5.5rem]">
            Archive
          </h1>
          <p className="mt-8 max-w-md text-sm font-light leading-relaxed text-[#6b6b6b]">
            Traces of a life spent making work.
          </p>
        </motion.div>
      </header>

      <main>
        {mediaItems.length === 0 ? (
          <div className="px-6 py-40 text-center md:px-12">
            <p className="font-display text-xl text-[#8a8a8a]">
              The archive is empty for now.
            </p>
          </div>
        ) : (
          mediaItems.map((item, index) => {
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
                viewport={{ once: true, margin: "-12% 0px" }}
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
                      <div className="archive-media relative w-full overflow-hidden bg-[#f5f5f5]">
                        <img
                          src={hero}
                          alt={item.title}
                          className="h-[55vh] w-full object-cover transition-transform duration-700 ease-in-out md:h-[72vh] lg:h-[85vh]"
                          style={{
                            transform: isHovered ? "scale(1.02)" : "scale(1)",
                          }}
                        />
                        {item.type === "video" && (
                          <div
                            className="pointer-events-none absolute inset-0 flex items-center justify-center"
                            aria-hidden
                          >
                            <span
                              className="h-14 w-14 rounded-full border border-white/70 bg-white/10 backdrop-blur-[2px] transition-opacity duration-500"
                              style={{ opacity: isHovered ? 0.9 : 0.55 }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mx-auto max-w-4xl px-6 pt-10 md:px-12 md:pt-14 lg:px-0">
                      <div className="flex items-baseline gap-4">
                        <span className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
                          {label}
                        </span>
                        {item.year && (
                          <span className="font-display text-xs tracking-[0.16em] text-[#9a9a9a]">
                            {item.year}
                          </span>
                        )}
                        {item.duration && (
                          <span className="font-display text-xs tracking-[0.16em] text-[#9a9a9a]">
                            {item.duration}
                          </span>
                        )}
                      </div>

                      <h2
                        className="mt-4 font-display text-4xl font-light leading-[1.05] tracking-tight text-[#1a1a1a] transition-opacity duration-500 md:text-5xl lg:text-6xl xl:text-[4.25rem]"
                        style={{ opacity: isHovered ? 0.7 : 1 }}
                      >
                        {item.title}
                      </h2>

                      {item.shortDesc && (
                        <p
                          className="mt-6 max-w-xl text-sm font-light leading-relaxed text-[#6b6b6b] transition-opacity duration-700"
                          style={{ opacity: isHovered ? 1 : 0.85 }}
                        >
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
                        <h2 className="mt-4 font-display text-3xl font-light leading-tight tracking-tight text-[#1a1a1a] md:text-4xl">
                          {item.title}
                        </h2>
                        {item.shortDesc && (
                          <p className="mt-4 text-sm font-light leading-relaxed text-[#6b6b6b]">
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
                      {item.duration ? ` · ${item.duration}` : ""}
                    </span>

                    <h2 className="mt-5 font-display text-4xl font-light leading-[1.08] tracking-tight text-[#1a1a1a] transition-opacity duration-500 md:text-5xl lg:text-6xl">
                      {item.title}
                    </h2>

                    {item.shortDesc && (
                      <p className="mt-6 text-sm font-light leading-relaxed text-[#5a5a5a]">
                        {item.shortDesc}
                      </p>
                    )}

                    {hero && (
                      <div className="archive-media mt-14 overflow-hidden bg-[#f5f5f5]">
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
                      className="mt-10 inline-block font-display text-xs uppercase tracking-[0.28em] text-[#1a1a1a] transition-opacity duration-500"
                      style={{ opacity: isHovered ? 1 : 0.45 }}
                    >
                      {item.type === "blog_post" ? "Read" : "Open"}
                    </span>
                  </Link>
                )}
              </motion.article>
            );
          })
        )}
      </main>

      <footer className="px-6 pb-24 pt-8 md:px-12 lg:px-20">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[#b0b0b0]">
          End of archive
        </p>
      </footer>
    </div>
  );
};

export default ArchivePage;
