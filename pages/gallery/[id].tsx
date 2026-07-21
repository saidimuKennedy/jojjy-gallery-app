import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import { motion } from "framer-motion";
import type { GetStaticPaths, GetStaticProps } from "next";
import Navbar from "@/components/ui/Navbar";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { pickImageUrl } from "@/lib/cloudinary";
import { getMediaBlogEntryById } from "@/lib/data/media-blog";
import { APIResponse, MediaBlogEntryWithRelations } from "@/types/api";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch data");
  }
  return res.json();
};

const CATALOGUE_LABEL: Record<string, string> = {
  VIDEO: "Film",
  IMAGES: "Photograph",
  AUDIO: "Sound",
  BLOG_POST: "Essay",
  EXTERNAL_LINK: "Note",
};

interface ArchiveDetailPageProps {
  initialEntry: MediaBlogEntryWithRelations | null;
}

function DetailImage({
  src,
  alt,
  priority = false,
  preset = "hero" as const,
  className = "aspect-[4/3] w-full",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  preset?: "hero" | "card";
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#f5f5f5] ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        preset={preset}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 1400px"
        className="object-cover"
      />
    </div>
  );
}

const SingleArchiveEntryPage = ({ initialEntry }: ArchiveDetailPageProps) => {
  const router = useRouter();
  const { id } = router.query;

  const shouldFetch = typeof id === "string";
  const {
    data: apiResponse,
    error,
    isLoading,
  } = useSWR<APIResponse<MediaBlogEntryWithRelations>>(
    shouldFetch ? `/api/media-blog/${id}` : null,
    fetcher,
    { fallbackData: initialEntry ? { success: true, data: initialEntry } : undefined }
  );

  const entry = apiResponse?.data;

  useEffect(() => {
    document.documentElement.classList.add("archive-page");
    return () => document.documentElement.classList.remove("archive-page");
  }, []);

  if (isLoading && !entry) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a]">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="font-display text-lg tracking-wide text-[#8a8a8a]">
            Loading…
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
          <p className="font-display text-2xl">{error.message}</p>
          <Link
            href="/gallery"
            className="mt-8 font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a] hover:text-[#1a1a1a]"
          >
            Back to archive
          </Link>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a]">
        <Navbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-2xl text-[#8a8a8a]">
            This entry could not be found.
          </p>
          <Link
            href="/gallery"
            className="mt-8 font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a] hover:text-[#1a1a1a]"
          >
            Back to archive
          </Link>
        </div>
      </div>
    );
  }

  const label = CATALOGUE_LABEL[entry.type] || entry.type;
  const year = entry.createdAt
    ? new Date(entry.createdAt).getFullYear().toString()
    : null;
  const mainMediaFile = entry.mediaFiles?.[0];

  const renderMedia = () => {
    switch (entry.type) {
      case "VIDEO":
        if (
          entry.externalLink &&
          (entry.externalLink.includes("youtube.com") ||
            entry.externalLink.includes("youtu.be") ||
            entry.externalLink.includes("vimeo.com"))
        ) {
          let embedSrc = entry.externalLink;
          if (entry.externalLink.includes("youtu")) {
            const videoId =
              entry.externalLink.split("v=")[1]?.split("&")[0] ||
              entry.externalLink.split("/").pop();
            embedSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;
          } else if (entry.externalLink.includes("vimeo.com")) {
            const videoId = entry.externalLink.split("/").pop();
            embedSrc = `https://player.vimeo.com/video/${videoId}`;
          }
          return (
            <div className="relative aspect-video w-full bg-[#111]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={embedSrc}
                title={entry.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        return entry.thumbnailUrl ? (
          <DetailImage
            src={pickImageUrl(entry.thumbnailUrl, undefined, "hero")}
            alt={entry.title}
            priority
          />
        ) : null;

      case "IMAGES":
        return (
          <div className="flex flex-col gap-16 md:gap-24">
            {entry.mediaFiles && entry.mediaFiles.length > 0 ? (
              entry.mediaFiles.map((file, index) => (
                <motion.figure
                  key={file.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DetailImage
                    src={pickImageUrl(
                      file.thumbnailUrl,
                      file.url,
                      index === 0 ? "hero" : "card"
                    )}
                    alt={file.description || entry.title}
                    priority={index === 0}
                    preset={index === 0 ? "hero" : "card"}
                  />
                  {file.description && (
                    <figcaption className="mt-4 font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a]">
                      {file.description}
                    </figcaption>
                  )}
                </motion.figure>
              ))
            ) : (
              <p className="font-light text-[#8a8a8a]">No images available.</p>
            )}
          </div>
        );

      case "AUDIO":
        return (
          <div className="py-12">
            {entry.thumbnailUrl && (
              <DetailImage
                src={pickImageUrl(entry.thumbnailUrl, undefined, "card")}
                alt=""
                preset="card"
                className="mb-10 aspect-[16/9] w-full"
              />
            )}
            {mainMediaFile?.url ? (
              <audio controls className="w-full max-w-lg accent-[#1a1a1a]">
                <source src={mainMediaFile.url} type="audio/mpeg" />
              </audio>
            ) : entry.externalLink ? (
              <a
                href={entry.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xs uppercase tracking-[0.28em] text-[#1a1a1a] underline-offset-4 hover:underline"
              >
                Listen
              </a>
            ) : null}
          </div>
        );

      case "BLOG_POST":
        return (
          <div>
            {entry.thumbnailUrl && (
              <DetailImage
                src={pickImageUrl(entry.thumbnailUrl, undefined, "hero")}
                alt=""
                priority
                className="mb-16 aspect-[16/10] w-full md:mb-20"
              />
            )}
            {entry.content && (
              <div
                className="archive-prose text-sm font-light leading-relaxed text-[#2a2a2a] md:text-[0.9375rem] md:leading-[1.75]"
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />
            )}
          </div>
        );

      case "EXTERNAL_LINK":
        return (
          <div>
            {entry.thumbnailUrl && (
              <DetailImage
                src={pickImageUrl(entry.thumbnailUrl, undefined, "card")}
                alt=""
                preset="card"
                className="mb-10 aspect-[16/10] w-full"
              />
            )}
            {entry.externalLink && (
              <a
                href={entry.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xs uppercase tracking-[0.28em] text-[#1a1a1a] underline-offset-4 hover:underline"
              >
                Open source
              </a>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <Navbar />

      <div className="px-6 pt-10 md:px-12 lg:px-20">
        <Link
          href="/gallery"
          className="font-display text-xs uppercase tracking-[0.32em] text-[#8a8a8a] transition-colors duration-500 hover:text-[#1a1a1a]"
        >
          ← Archive
        </Link>
      </div>

      <header className="mx-auto max-w-4xl px-6 pb-12 pt-16 md:px-12 md:pb-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-display text-xs uppercase tracking-[0.32em] text-[#8a8a8a]">
            {label}
            {year ? ` · ${year}` : ""}
            {entry.duration ? ` · ${entry.duration}` : ""}
          </p>
          <h1 className="mt-6 font-display text-4xl font-light leading-[1.05] tracking-tight text-[#1a1a1a] md:text-6xl lg:text-7xl">
            {entry.title}
          </h1>
          {entry.shortDesc && (
            <p className="mt-8 max-w-2xl text-sm font-light leading-relaxed text-[#6b6b6b]">
              {entry.shortDesc}
            </p>
          )}
          {entry.externalLink && entry.type !== "EXTERNAL_LINK" && (
            <a
              href={entry.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block font-display text-xs uppercase tracking-[0.28em] text-[#1a1a1a] underline-offset-4 hover:underline"
            >
              View original
            </a>
          )}
        </motion.div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={
          entry.type === "IMAGES" || entry.type === "VIDEO"
            ? "w-full px-0 md:px-0"
            : "mx-auto max-w-4xl px-6 md:px-12"
        }
      >
        <div
          className={
            entry.type === "IMAGES" || entry.type === "VIDEO"
              ? "mx-auto max-w-[1400px] px-0 md:px-12 lg:px-20"
              : ""
          }
        >
          {renderMedia()}
        </div>

        {entry.content && entry.type !== "BLOG_POST" && (
          <div
            className="archive-prose mx-auto mt-20 max-w-3xl px-6 text-sm font-light leading-relaxed text-[#2a2a2a] md:px-12 md:text-[0.9375rem] md:leading-[1.75]"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        )}
      </motion.div>

      <footer className="mx-auto max-w-4xl px-6 pb-28 pt-24 md:px-12">
        <Link
          href="/gallery"
          className="font-display text-xs uppercase tracking-[0.28em] text-[#8a8a8a] transition-colors duration-500 hover:text-[#1a1a1a]"
        >
          ← Back to archive
        </Link>
      </footer>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<ArchiveDetailPageProps> = async ({
  params,
}) => {
  const id = parseInt(String(params?.id), 10);
  if (isNaN(id)) {
    return { notFound: true };
  }

  const initialEntry = await getMediaBlogEntryById(id);
  if (!initialEntry) {
    return { notFound: true };
  }

  return {
    props: {
      initialEntry: JSON.parse(
        JSON.stringify(initialEntry)
      ) as MediaBlogEntryWithRelations,
    },
    revalidate: 120,
  };
};

export default SingleArchiveEntryPage;
