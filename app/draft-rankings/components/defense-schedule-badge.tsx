"use client";

import type { PointerEvent, MouseEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDefenseSchedule } from "@/lib/draft-rankings/defense-schedule";
import type { NflTeam } from "@/lib/draft-rankings/types";
import { cn } from "@/lib/utils";

import { DefenseScheduleDialog } from "./defense-schedule-dialog";
import {
  DEFENSE_SCHEDULE_DIFFICULTY_STYLES,
  formatDefenseScheduleSummary,
} from "./defense-schedule-style";

interface DefenseScheduleBadgeProps {
  team: NflTeam;
  teamName?: string;
  className?: string;
}

function stopBoardActivation(
  event: PointerEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>,
) {
  event.stopPropagation();
}

export function DefenseScheduleBadge({
  team,
  teamName,
  className,
}: DefenseScheduleBadgeProps) {
  const schedule = getDefenseSchedule(team);
  const style = DEFENSE_SCHEDULE_DIFFICULTY_STYLES[schedule.difficulty];
  const summary = formatDefenseScheduleSummary(schedule);
  const { Icon } = style;

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={summary}
              onPointerDown={stopBoardActivation}
              onClick={stopBoardActivation}
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className,
              )}
            >
              <Badge
                variant="outline"
                aria-hidden
                className={cn(
                  "size-5 border p-0 shadow-xs [&>svg]:size-3",
                  style.className,
                )}
              >
                <Icon />
              </Badge>
            </button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{summary}</TooltipContent>
      </Tooltip>
      <DefenseScheduleDialog
        team={team}
        teamName={teamName}
        schedule={schedule}
      />
    </Dialog>
  );
}
