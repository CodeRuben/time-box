"use client";

import { Button } from "@/components/ui/button";
import { LEAGUE_SIZES, type LeagueSize } from "@/lib/draft-rankings/types";

interface LeagueSizeSelectProps {
  value: LeagueSize;
  onChange: (leagueSize: LeagueSize) => void;
}

export function LeagueSizeSelect({
  value,
  onChange,
}: LeagueSizeSelectProps) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="League size">
      {LEAGUE_SIZES.map((size) => {
        const isActive = value === size;

        return (
          <Button
            key={size}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            aria-pressed={isActive}
            onClick={() => onChange(size)}
          >
            {size} teams
          </Button>
        );
      })}
    </div>
  );
}
