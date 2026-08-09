import {
  isProductArea,
  type ProductNoteDto,
} from "@/lib/product-notes/types";

export function toProductNoteDto(row: {
  id: string;
  title: string;
  description: string;
  productArea: string;
  createdAt: Date;
  updatedAt: Date;
}): ProductNoteDto {
  if (!isProductArea(row.productArea)) {
    throw new Error(`Invalid product area stored for note ${row.id}`);
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    productArea: row.productArea,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
