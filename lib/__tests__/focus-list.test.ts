import { describe, expect, it } from "vitest";
import { createMockFocusListItems } from "./fixtures/focus-list";
import {
  addFocusListItem,
  appendCopiedFocusListItems,
  copyFocusListItems,
  getFocusListItemLabel,
  getFocusListItemSubitems,
  getItemsByStatus,
  isValidFocusListItem,
  moveFocusListItem,
  parseFocusListItems,
  reorderFocusListItems,
  renormalizeFocusListOrders,
  setFocusListItemStatus,
} from "../focus-list";

describe("getItemsByStatus", () => {
  it("groups and sorts items by status", () => {
    const items = createMockFocusListItems();
    expect(getItemsByStatus(items, "todo").map((item) => item.id)).toEqual([
      "mock-focus-4",
      "mock-focus-5",
      "mock-focus-6",
    ]);
    expect(getItemsByStatus(items, "complete")).toHaveLength(3);
  });
});

describe("addFocusListItem", () => {
  it("adds new items to todo", () => {
    const items = addFocusListItem([], {
      type: "brain_dump",
      text: "New task",
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      status: "todo",
      source: { type: "brain_dump", text: "New task" },
    });
  });
});

describe("setFocusListItemStatus", () => {
  it("moves an item to complete", () => {
    const items = createMockFocusListItems();
    const updated = setFocusListItemStatus(items, "mock-focus-5", "complete");

    expect(
      updated.find((item) => item.id === "mock-focus-5")
    ).toMatchObject({
      status: "complete",
    });
  });
});

describe("moveFocusListItem", () => {
  it("moves an item between columns at a target index", () => {
    const items = createMockFocusListItems();
    const updated = moveFocusListItem(items, "mock-focus-6", "todo", 0);

    expect(getItemsByStatus(updated, "todo").map((item) => item.id)).toEqual([
      "mock-focus-6",
      "mock-focus-4",
      "mock-focus-5",
    ]);
  });

  it("reorders within todo when dragging an item down", () => {
    const items = [
      {
        id: "a",
        status: "todo" as const,
        order: 0,
        source: { type: "brain_dump" as const, text: "A" },
      },
      {
        id: "b",
        status: "todo" as const,
        order: 1,
        source: { type: "brain_dump" as const, text: "B" },
      },
      {
        id: "c",
        status: "todo" as const,
        order: 2,
        source: { type: "brain_dump" as const, text: "C" },
      },
    ];

    const updated = moveFocusListItem(items, "a", "todo", 2);

    expect(getItemsByStatus(updated, "todo").map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
});

describe("reorderFocusListItems", () => {
  const items = [
    {
      id: "a",
      status: "todo" as const,
      order: 0,
      source: { type: "brain_dump" as const, text: "A" },
    },
    {
      id: "b",
      status: "todo" as const,
      order: 1,
      source: { type: "brain_dump" as const, text: "B" },
    },
    {
      id: "c",
      status: "todo" as const,
      order: 2,
      source: { type: "brain_dump" as const, text: "C" },
    },
  ];

  it("reorders items using sortable list semantics", () => {
    const updated = reorderFocusListItems(items, "todo", "a", "c");

    expect(getItemsByStatus(updated, "todo").map((item) => item.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("returns the same array when active and over ids match", () => {
    expect(reorderFocusListItems(items, "todo", "a", "a")).toBe(items);
  });
});

describe("getFocusListItemLabel", () => {
  it("uses the live priority name when the source still exists", () => {
    const item = addFocusListItem([], {
      type: "priority",
      priorityId: "priority-1",
      label: "Old name",
    })[0]!;

    expect(
      getFocusListItemLabel(item, [{ id: "priority-1", name: "New name" }])
    ).toBe("New name");
  });
});

describe("appendCopiedFocusListItems", () => {
  it("dedupes by source key and appends new orders", () => {
    const current = [
      {
        id: "current-1",
        status: "todo" as const,
        order: 0,
        source: { type: "brain_dump" as const, text: "Existing" },
      },
    ];
    const copied = [
      {
        id: "copy-1",
        status: "todo" as const,
        order: 0,
        source: { type: "brain_dump" as const, text: "Existing" },
      },
      {
        id: "copy-2",
        status: "todo" as const,
        order: 0,
        source: { type: "brain_dump" as const, text: "New item" },
      },
    ];

    const result = appendCopiedFocusListItems(current, copied);

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      order: 1,
      source: { type: "brain_dump", text: "New item" },
    });
  });
});

describe("parseFocusListItems", () => {
  it("returns an empty array for non-array input", () => {
    expect(parseFocusListItems(null)).toEqual([]);
  });

  it("filters invalid entries and keeps valid ones", () => {
    const result = parseFocusListItems([
      {
        id: "valid",
        status: "todo",
        order: 0,
        source: { type: "brain_dump", text: "Ship it" },
      },
      { id: "missing-status" },
      {
        id: "bad-source",
        status: "todo",
        order: 1,
        source: { type: "priority", label: "No id" },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("valid");
  });
});

describe("isValidFocusListItem", () => {
  it("rejects unknown source types", () => {
    expect(
      isValidFocusListItem({
        id: "1",
        status: "todo",
        order: 0,
        source: { type: "time_slot", slotKey: "7 AM:00" },
      })
    ).toBe(false);
  });
});

describe("copyFocusListItems", () => {
  it("copies only todo items when onlyUnfinished is true", () => {
    const items = createMockFocusListItems();
    const copied = copyFocusListItems(items, true);

    expect(copied.every((item) => item.status === "todo")).toBe(true);
    expect(copied).toHaveLength(3);
    expect(copied.every((item) => item.id !== "mock-focus-4")).toBe(true);
  });
});

describe("renormalizeFocusListOrders", () => {
  it("reindexes todo and complete orders independently", () => {
    const items = [
      {
        id: "todo-2",
        status: "todo" as const,
        order: 5,
        source: { type: "brain_dump" as const, text: "B" },
      },
      {
        id: "todo-1",
        status: "todo" as const,
        order: 2,
        source: { type: "brain_dump" as const, text: "A" },
      },
      {
        id: "done-1",
        status: "complete" as const,
        order: 9,
        source: { type: "brain_dump" as const, text: "Done" },
      },
    ];

    const result = renormalizeFocusListOrders(items);

    expect(result.find((item) => item.id === "todo-1")?.order).toBe(0);
    expect(result.find((item) => item.id === "todo-2")?.order).toBe(1);
    expect(result.find((item) => item.id === "done-1")?.order).toBe(0);
  });
});

describe("getFocusListItemSubitems", () => {
  const context = {
    priorities: [
      {
        id: "priority-1",
        subtasks: [
          { name: "Draft outline", completed: true },
          { name: "Send review", completed: false },
        ],
      },
    ],
    brainDumpCandidates: [
      {
        name: "Ship login flow",
        subtasks: ["Design mockups", "Write tests"],
      },
    ],
  };

  it("returns priority subtasks", () => {
    const item = {
      id: "focus-1",
      status: "todo" as const,
      order: 0,
      source: {
        type: "priority" as const,
        priorityId: "priority-1",
        label: "Launch feature",
      },
    };

    expect(getFocusListItemSubitems(item, context)).toEqual([
      { name: "Draft outline", completed: true },
      { name: "Send review", completed: false },
    ]);
  });

  it("returns brain dump subtasks by case-insensitive name", () => {
    const item = {
      id: "focus-3",
      status: "todo" as const,
      order: 0,
      source: {
        type: "brain_dump" as const,
        text: "  ship login flow ",
      },
    };

    expect(getFocusListItemSubitems(item, context)).toEqual([
      { name: "Design mockups" },
      { name: "Write tests" },
    ]);
  });

  it("returns an empty list when no linked subitems exist", () => {
    const item = {
      id: "focus-4",
      status: "todo" as const,
      order: 0,
      source: {
        type: "brain_dump" as const,
        text: "Standalone item",
      },
    };

    expect(getFocusListItemSubitems(item, context)).toEqual([]);
  });
});
