import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import {
  OPEN_LIBRARY_USER_AGENT,
  extractWorkId,
  mapEditionsToCoverOptions,
  type OpenLibraryEdition,
} from "@/lib/book-search";

// Open Library's own docs cap this well below its "please don't crawl" guidance;
// most works surface their common covers within the first page of editions anyway.
const EDITIONS_LIMIT = 50;

export async function GET(request: Request) {
  const access = await requireFeatureUser(
    "reading-journal",
    "Reading journal is disabled"
  );
  if (access.response) {
    return access.response;
  }

  const { searchParams } = new URL(request.url);
  const workId = extractWorkId(searchParams.get("key")?.trim() ?? "");

  if (!workId) {
    return NextResponse.json({ data: [] });
  }

  const editionsUrl = `https://openlibrary.org/works/${workId}/editions.json?limit=${EDITIONS_LIMIT}`;

  try {
    const response = await fetch(editionsUrl, {
      headers: { "User-Agent": OPEN_LIBRARY_USER_AGENT },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Open Library responded with ${response.status}`);
    }

    const payload = (await response.json()) as {
      entries?: OpenLibraryEdition[];
    };
    const options = mapEditionsToCoverOptions(payload.entries ?? []);

    return NextResponse.json({ data: options });
  } catch (error) {
    console.error("Cover lookup failed:", error);
    return NextResponse.json(
      { error: "Cover lookup is unavailable" },
      { status: 502 }
    );
  }
}
