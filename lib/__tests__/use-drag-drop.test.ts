import { describe, it, expect } from "vitest";
import { getDraggableProps } from "../use-drag-drop";

describe("getDraggableProps", () => {
  it("returns draggable=true when enabled with text", () => {
    const props = getDraggableProps("Some text", true);
    expect(props.draggable).toBe(true);
  });

  it("returns draggable=false when disabled", () => {
    const props = getDraggableProps("Some text", false);
    expect(props.draggable).toBe(false);
  });

  it("returns draggable=false when text is empty", () => {
    const props = getDraggableProps("", true);
    expect(props.draggable).toBe(false);
  });

  it("returns draggable=true by default when enabled param omitted", () => {
    const props = getDraggableProps("Some text");
    expect(props.draggable).toBe(true);
  });

  it("returns draggable=false when both disabled and empty text", () => {
    const props = getDraggableProps("", false);
    expect(props.draggable).toBe(false);
  });

  it("includes onDragStart handler", () => {
    const props = getDraggableProps("Test");
    expect(typeof props.onDragStart).toBe("function");
  });
});
