import Link from "next/link";
import type { ReactNode } from "react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import type { ImagePreset } from "@/lib/cloudinary";

export function Shell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1600px] px-6 md:px-12 lg:px-20 ${className}`}
    >
      {children}
    </div>
  );
}

/** Section title rendered as an `h2` but styled as the gold eyebrow label. */
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={`jenga-eyebrow ${className}`}>{children}</h2>;
}

export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`jenga-link group ${className}`}>
      <span>{children}</span>
      <span
        aria-hidden
        className="transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}

export function ButtonLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`jenga-btn ${className}`}>
      {children}
    </Link>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`jenga-rule block h-px w-10 ${className}`} />
  );
}

export function MediaFrame({
  src,
  alt,
  aspect = "aspect-[4/3]",
  preset = "card",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  className = "",
}: {
  src?: string | null;
  alt: string;
  aspect?: string;
  preset?: ImagePreset;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-black ${aspect} ${className}`}
    >
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          preset={preset}
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
        />
      ) : null}
    </div>
  );
}
