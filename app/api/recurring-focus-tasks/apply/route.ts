import { NextResponse } from "next/server";
import { requireFeatureUser } from "@/lib/auth-session";
import { isDateKey } from "@/lib/date-key";
import { applyRecurringFocusTasksForDate } from "@/lib/recurring-focus-tasks/apply";

export async function POST(request: Request) {
  const access = await requireFeatureUser("planner", "Planner is disabled");
  if (access.response) {
    return access.response;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const date = (raw as { date?: unknown }).date;
  if (typeof date !== "string" || !isDateKey(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const addedItems = await applyRecurringFocusTasksForDate(access.userId, date);
  return NextResponse.json({ data: { addedItems } });
}
