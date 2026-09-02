"use client";

import { Badge } from "@/components/ui/badge";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTeamLogo } from "@/lib/draft-rankings/headshots";
import type { DefenseSchedule } from "@/lib/draft-rankings/defense-schedule";
import type { NflTeam } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

import {
  DEFENSE_SCHEDULE_DIFFICULTY_STYLES,
  formatDefenseScheduleSummary,
  formatMatchupLocation,
} from "./defense-schedule-style";

interface DefenseScheduleDialogProps {
  team: NflTeam;
  teamName?: string;
  schedule: DefenseSchedule;
}

function OpponentLogo({ team }: { team: NflTeam }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getTeamLogo(team)}
      alt=""
      width={20}
      height={20}
      className="size-5 shrink-0 object-contain"
    />
  );
}

export function DefenseScheduleDialog({
  team,
  teamName,
  schedule,
}: DefenseScheduleDialogProps) {
  const title = `${teamName ?? team} schedule`;
  const summary = formatDefenseScheduleSummary(schedule);

  return (
    <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{summary}</DialogDescription>
      </DialogHeader>

      <ol className="flex flex-col gap-1" aria-label={`${title} by week`}>
        {schedule.weeks.map((week) => {
          if (week.kind === "bye") {
            return (
              <li
                key={week.week}
                className="flex min-h-8 items-center gap-2 rounded-md px-1 py-1 text-sm"
              >
                <span className="w-14 shrink-0 tabular-nums text-muted-foreground">
                  Week {week.week}
                </span>
                <span>Bye</span>
              </li>
            );
          }

          const difficultyStyle =
            DEFENSE_SCHEDULE_DIFFICULTY_STYLES[week.difficulty];
          const locationLabel = formatMatchupLocation(week.location);

          return (
            <li
              key={week.week}
              className="flex min-h-8 items-center gap-2 rounded-md px-1 py-1 text-sm"
            >
              <span className="w-14 shrink-0 tabular-nums text-muted-foreground">
                Week {week.week}
              </span>
              <OpponentLogo team={week.opponent} />
              <span className="min-w-0 flex-1 truncate">
                {locationLabel} {week.opponent}
              </span>
              <Badge
                variant="outline"
                className={cn("border shadow-xs", difficultyStyle.className)}
              >
                {difficultyStyle.label}
              </Badge>
            </li>
          );
        })}
      </ol>
    </DialogContent>
  );
}
