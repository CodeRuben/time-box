import {
  DEFAULT_PRODUCT_AREA,
  isProductArea,
  type ProductNoteCreateInput,
  type ProductNotePatchInput,
} from "@/lib/product-notes/types";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

function readRequiredTitle(
  body: Record<string, unknown>
): ValidationResult<string> {
  if (!("title" in body) || typeof body.title !== "string") {
    return { ok: false, message: "Title is required" };
  }

  const title = body.title.trim();
  if (!title) {
    return { ok: false, message: "Title is required" };
  }

  return { ok: true, value: title };
}

function readOptionalDescription(
  body: Record<string, unknown>
): ValidationResult<string | undefined> {
  if (!("description" in body)) {
    return { ok: true, value: undefined };
  }

  if (typeof body.description !== "string") {
    return { ok: false, message: "Description must be a string" };
  }

  return { ok: true, value: body.description.trim() };
}

export function parseCreateBody(
  raw: unknown
): ValidationResult<ProductNoteCreateInput> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Invalid request body" };
  }

  const body = raw as Record<string, unknown>;
  const titleResult = readRequiredTitle(body);
  if (!titleResult.ok) {
    return titleResult;
  }

  const descriptionResult = readOptionalDescription(body);
  if (!descriptionResult.ok) {
    return descriptionResult;
  }

  let productArea = DEFAULT_PRODUCT_AREA;
  if ("productArea" in body) {
    if (!isProductArea(body.productArea)) {
      return { ok: false, message: "Invalid product area" };
    }
    productArea = body.productArea;
  }

  return {
    ok: true,
    value: {
      title: titleResult.value,
      description: descriptionResult.value ?? "",
      productArea,
    },
  };
}

export function parsePatchBody(
  raw: unknown
): ValidationResult<ProductNotePatchInput> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Invalid request body" };
  }

  const body = raw as Record<string, unknown>;
  const patch: ProductNotePatchInput = {};

  if ("title" in body) {
    if (typeof body.title !== "string") {
      return { ok: false, message: "Title must be a string" };
    }
    const title = body.title.trim();
    if (!title) {
      return { ok: false, message: "Title is required" };
    }
    patch.title = title;
  }

  if ("description" in body) {
    if (typeof body.description !== "string") {
      return { ok: false, message: "Description must be a string" };
    }
    patch.description = body.description.trim();
  }

  if ("productArea" in body) {
    if (!isProductArea(body.productArea)) {
      return { ok: false, message: "Invalid product area" };
    }
    patch.productArea = body.productArea;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: "No fields to update" };
  }

  return { ok: true, value: patch };
}
