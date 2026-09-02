import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { Player } from "@/lib/draft-rankings/types";

import { CompactPlayerRow } from "./compact-player-row";
import { SortablePlayerCard } from "./player-card";

function renderBoard(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    isDragging: false,
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

const TEXANS_DEFENSE: Player = {
  id: 1,
  key: "team:HOU",
  rank: 1,
  name: "Houston Texans",
  position: "DST",
  nflTeam: "HOU",
  bye: 8,
  headshot: null,
  signals: [],
};

const NON_DEFENSE: Player = {
  ...TEXANS_DEFENSE,
  key: "espn:1",
  name: "Test Running Back",
  position: "RB",
};

describe("defense schedule Board integration", () => {
  it("renders the schedule control only for DST cards", () => {
    const onToggleTaken = vi.fn();
    const { rerender } = renderBoard(
      <SortablePlayerCard
        player={TEXANS_DEFENSE}
        dimmed={false}
        taken={false}
        draftMode={false}
        onToggleTaken={onToggleTaken}
      />,
    );

    expect(
      screen.getByRole("button", { name: /schedule, rank \d+ of 32/i }),
    ).toBeTruthy();

    rerender(
      <SortablePlayerCard
        player={NON_DEFENSE}
        dimmed={false}
        taken={false}
        draftMode={false}
        onToggleTaken={onToggleTaken}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /schedule, rank \d+ of 32/i }),
    ).toBeNull();
  });

  it("opens a card schedule without toggling the DST in Live Draft", () => {
    const onToggleTaken = vi.fn();

    renderBoard(
      <SortablePlayerCard
        player={TEXANS_DEFENSE}
        dimmed={false}
        taken={false}
        draftMode
        onToggleTaken={onToggleTaken}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /schedule, rank \d+ of 32/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Houston Texans schedule" }),
    ).toBeTruthy();
    expect(onToggleTaken).not.toHaveBeenCalled();
  });

  it("opens a compact-row schedule without toggling the DST in Live Draft", () => {
    const onToggleTaken = vi.fn();

    renderBoard(
      <CompactPlayerRow
        player={TEXANS_DEFENSE}
        dimmed={false}
        taken={false}
        draftMode
        prefersReducedMotion={false}
        onToggleTaken={onToggleTaken}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /schedule, rank \d+ of 32/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Houston Texans schedule" }),
    ).toBeTruthy();
    expect(onToggleTaken).not.toHaveBeenCalled();
  });
});
