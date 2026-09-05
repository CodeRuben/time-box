export const PRODUCT_AREAS = [
  "planner",
  "workouts",
  "book_log",
  "new_page",
] as const;

export type ProductArea = (typeof PRODUCT_AREAS)[number];

export const PRODUCT_AREA_LABELS: Record<ProductArea, string> = {
  planner: "Planner",
  workouts: "Workouts",
  book_log: "Books",
  new_page: "New page",
};

export const DEFAULT_PRODUCT_AREA: ProductArea = "planner";

export interface ProductNoteDto {
  id: string;
  title: string;
  description: string;
  productArea: ProductArea;
  createdAt: string;
  updatedAt: string;
}

export interface ProductNoteCreateInput {
  title: string;
  description: string;
  productArea: ProductArea;
}

export interface ProductNotePatchInput {
  title?: string;
  description?: string;
  productArea?: ProductArea;
}

export function isProductArea(value: unknown): value is ProductArea {
  return (
    typeof value === "string" &&
    (PRODUCT_AREAS as readonly string[]).includes(value)
  );
}
