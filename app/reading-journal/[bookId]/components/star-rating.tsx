"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/reading-progress";

interface StarRatingProps {
  rating: number | null; // 1-10 half-star scale
  onChange: (rating: number | null) => void;
}

const STAR_COUNT = 5;

export function StarRating({ rating, onChange }: StarRatingProps) {
  const handleSelect = (value: number) => {
    onChange(rating === value ? null : value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={rating === null ? "Rating: unrated" : `Rating: ${formatRating(rating)} stars`}
      className="flex items-center gap-0.5"
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const starIndex = index + 1;
        const halfValue = starIndex * 2 - 1;
        const fullValue = starIndex * 2;
        const fillLevel =
          rating === null ? 0 : Math.max(0, Math.min(2, rating - (starIndex - 1) * 2));

        return (
          <div key={starIndex} className="relative size-6">
            <Star className="pointer-events-none size-6 text-muted-foreground/30" />
            <Star
              className={cn(
                "pointer-events-none absolute inset-0 size-6 fill-current text-(color:--journal-rose) transition-opacity duration-100 ease motion-reduce:transition-none",
                fillLevel > 0 ? "opacity-100" : "opacity-0"
              )}
              style={
                fillLevel === 1 ? { clipPath: "inset(0 50% 0 0)" } : undefined
              }
            />
            <button
              type="button"
              role="radio"
              aria-checked={rating === halfValue}
              aria-label={`${halfValue / 2} stars`}
              onClick={() => handleSelect(halfValue)}
              className={cn(
                "absolute inset-0 z-10 w-1/2 cursor-pointer rounded-l-sm",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              )}
            />
            <button
              type="button"
              role="radio"
              aria-checked={rating === fullValue}
              aria-label={`${fullValue / 2} stars`}
              onClick={() => handleSelect(fullValue)}
              className={cn(
                "absolute inset-0 left-auto z-10 w-1/2 cursor-pointer rounded-r-sm",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
