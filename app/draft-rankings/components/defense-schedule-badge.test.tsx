import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { getDefenseSchedule } from "@/lib/draft-rankings/defense-schedule";

import { DefenseScheduleBadge } from "./defense-schedule-badge";
import {
  DEFENSE_SCHEDULE_DIFFICULTY_STYLES,
  formatDefenseScheduleSummary,
  formatMatchupLocation,
} from "./defense-schedule-style";

function renderBadge(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("DefenseScheduleBadge", () => {
  it("opens the weekly schedule dialog from the icon-only button", () => {
    const schedule = getDefenseSchedule("HOU");
    const summary = formatDefenseScheduleSummary(schedule);

    renderBadge(
      <DefenseScheduleBadge team="HOU" teamName="Houston Texans" />,
    );

    fireEvent.click(screen.getByRole("button", { name: summary }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Houston Texans schedule" }),
    ).toBeTruthy();
    expect(within(dialog).getByText(summary)).toBeTruthy();

    const weeks = within(dialog).getAllByRole("listitem");
    expect(weeks).toHaveLength(18);

    const byeWeek = schedule.weeks.find((week) => week.kind === "bye");
    expect(byeWeek).toBeDefined();
    expect(within(weeks[byeWeek!.week - 1]).getByText("Bye")).toBeTruthy();

    const firstMatchup = schedule.weeks.find((week) => week.kind === "matchup");
    expect(firstMatchup?.kind).toBe("matchup");
    if (firstMatchup?.kind !== "matchup") {
      return;
    }

    const firstRow = weeks[firstMatchup.week - 1];
    expect(
      within(firstRow).getByText(
        `${formatMatchupLocation(firstMatchup.location)} ${firstMatchup.opponent}`,
      ),
    ).toBeTruthy();
    expect(
      within(firstRow).getByText(
        DEFENSE_SCHEDULE_DIFFICULTY_STYLES[firstMatchup.difficulty].label,
      ),
    ).toBeTruthy();
  });
});
