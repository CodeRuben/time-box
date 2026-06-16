import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateSelector } from "./date-selector";

vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({
    onSelect,
  }: {
    onSelect?: (date: Date | undefined) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSelect?.(undefined)}>
        clear selection
      </button>
      <button type="button" onClick={() => onSelect?.(new Date(2026, 0, 15))}>
        select same day
      </button>
      <button type="button" onClick={() => onSelect?.(new Date(2026, 0, 16))}>
        select next day
      </button>
    </div>
  ),
}));

describe("DateSelector", () => {
  it("ignores cleared and same-day selections", () => {
    const handleChange = vi.fn();

    render(
      <DateSelector value={new Date(2026, 0, 15, 9)} onChange={handleChange} />
    );

    fireEvent.click(screen.getByText("clear selection"));
    fireEvent.click(screen.getByText("select same day"));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("notifies when a different day is selected", () => {
    const handleChange = vi.fn();

    render(
      <DateSelector value={new Date(2026, 0, 15, 9)} onChange={handleChange} />
    );

    fireEvent.click(screen.getByText("select next day"));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0]).toEqual(new Date(2026, 0, 16));
  });
});
