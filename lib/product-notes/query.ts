import {
  PRODUCT_AREA_LABELS,
  type ProductArea,
  type ProductNoteDto,
} from "@/lib/product-notes/types";

export type ProductAreaFilter = ProductArea | "all";

export function isProductAreaFilter(value: string): value is ProductAreaFilter {
  return value === "all" || value in PRODUCT_AREA_LABELS;
}

export function filterProductNotes(
  notes: ProductNoteDto[],
  {
    search,
    productArea,
  }: {
    search: string;
    productArea: ProductAreaFilter;
  }
): ProductNoteDto[] {
  const query = search.trim().toLowerCase();

  return notes.filter((note) => {
    if (productArea !== "all" && note.productArea !== productArea) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      note.title.toLowerCase().includes(query) ||
      note.description.toLowerCase().includes(query) ||
      PRODUCT_AREA_LABELS[note.productArea].toLowerCase().includes(query)
    );
  });
}
