"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating, RATING_UNITS_PER_STAR } from "@/lib/reading-progress";

interface StarRatingProps {
  rating: number | null; // 1-20 quarter-star scale
  onChange: (rating: number | null) => void;
}

const STAR_COUNT = 5;
const SEGMENT_WIDTH = 100 / RATING_UNITS_PER_STAR;
const STAR_SIZE_CLASS = "size-6";
const FILL_PERCENT_BY_LEVEL = [0, 35, 50, 65, 100] as const;

function canHoverPreview(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function StarRating({ rating, onChange }: StarRatingProps) {
  const [previewRating, setPreviewRating] = useState<number | null>(null);
  const visibleRating = previewRating ?? rating;

  const handleSelect = (value: number) => {
    onChange(rating === value ? null : value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={
        rating === null ? "Rating: unrated" : `Rating: ${formatRating(rating)} stars`
      }
      className="flex items-center gap-0.5"
      onMouseLeave={() => setPreviewRating(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPreviewRating(null);
        }
      }}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const starIndex = index + 1;
        const fillLevel =
          visibleRating === null
            ? 0
            : Math.max(
                0,
                Math.min(
                  RATING_UNITS_PER_STAR,
                  visibleRating - (starIndex - 1) * RATING_UNITS_PER_STAR
                )
              );

        return (
          <div
            key={starIndex}
            className={cn(
              "relative active:scale-[0.97] ease-out will-change-transform",
              "motion-reduce:transition-none motion-reduce:active:scale-100",
              STAR_SIZE_CLASS
            )}
          >
            <Star
              className={cn(
                "pointer-events-none text-muted-foreground/30",
                STAR_SIZE_CLASS
              )}
            />
            <Star
              className={cn(
                "pointer-events-none absolute inset-0 fill-current text-(color:--journal-rose) transition-opacity duration-100 ease motion-reduce:transition-none",
                STAR_SIZE_CLASS,
                fillLevel > 0 ? "opacity-100" : "opacity-0"
              )}
              style={
                fillLevel > 0
                  ? {
                      clipPath: `inset(0 ${100 - FILL_PERCENT_BY_LEVEL[fillLevel]}% 0 0)`,
                    }
                  : undefined
              }
            />
            {Array.from({ length: RATING_UNITS_PER_STAR }, (_, segmentIndex) => {
              const value =
                (starIndex - 1) * RATING_UNITS_PER_STAR + segmentIndex + 1;
              const isFirstSegment = segmentIndex === 0;
              const isLastSegment = segmentIndex === RATING_UNITS_PER_STAR - 1;

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${formatRating(value)} stars`}
                  onClick={() => handleSelect(value)}
                  onFocus={() => setPreviewRating(value)}
                  onMouseEnter={() => {
                    if (canHoverPreview()) setPreviewRating(value);
                  }}
                  className={cn(
                    "absolute inset-y-0 z-10 cursor-pointer",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                    isFirstSegment && "rounded-l-sm",
                    isLastSegment && "rounded-r-sm"
                  )}
                  style={{
                    left: `${segmentIndex * SEGMENT_WIDTH}%`,
                    width: `${SEGMENT_WIDTH}%`,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
