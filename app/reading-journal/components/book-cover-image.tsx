"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { isOpenLibraryCoverUrl } from "@/lib/book-search";

interface BookCoverImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export function BookCoverImage({
  src,
  alt,
  sizes = "168px",
  priority = false,
  className,
}: BookCoverImageProps) {
  if (isOpenLibraryCoverUrl(src)) {
    return (
      <div className="relative h-full w-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", className)}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
