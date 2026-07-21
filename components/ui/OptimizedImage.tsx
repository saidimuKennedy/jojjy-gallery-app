import Image, { ImageProps } from "next/image";
import {
  cloudinaryUrl,
  IMAGE_BLUR_DATA_URL,
  PRESET_SIZES,
  type ImagePreset,
} from "@/lib/cloudinary";

type OptimizedImageProps = Omit<
  ImageProps,
  "src" | "placeholder" | "blurDataURL"
> & {
  src: string;
  preset?: ImagePreset;
};

export default function OptimizedImage({
  src,
  preset = "full",
  sizes,
  priority = false,
  className,
  alt = "",
  fill,
  width,
  height,
  ...rest
}: OptimizedImageProps) {
  const optimizedSrc = cloudinaryUrl(src, preset);
  const resolvedSizes =
    sizes ?? (fill || !width ? PRESET_SIZES[preset] : undefined);

  const shared = {
    src: optimizedSrc,
    alt,
    priority,
    className,
    placeholder: "blur" as const,
    blurDataURL: IMAGE_BLUR_DATA_URL,
    sizes: resolvedSizes,
    ...rest,
  };

  if (fill) {
    return <Image fill {...shared} />;
  }

  if (width && height) {
    return <Image width={width} height={height} {...shared} />;
  }

  return <Image fill {...shared} />;
}
