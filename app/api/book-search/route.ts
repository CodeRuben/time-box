import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import {
  OPEN_LIBRARY_USER_AGENT,
  mapOpenLibraryDoc,
  type OpenLibraryDoc,
} from "@/lib/book-search";

export async function GET(request: Request) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ data: [] });
  }

  const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,editions,editions.cover_i&lang=en&limit=10`;

  try {
    const response = await fetch(searchUrl, {
      headers: { "User-Agent": OPEN_LIBRARY_USER_AGENT },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Open Library responded with ${response.status}`);
    }

    const payload = (await response.json()) as { docs?: OpenLibraryDoc[] };
    const results = (payload.docs ?? []).map(mapOpenLibraryDoc);

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Book search failed:", error);
    return NextResponse.json(
      { error: "Book search is unavailable" },
      { status: 502 }
    );
  }
}
