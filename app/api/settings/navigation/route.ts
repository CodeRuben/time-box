import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getNavigationItems, isAdminRole } from "@/lib/feature-access";

export async function GET() {
  const session = await getServerAuthSession();

  return NextResponse.json({
    items: await getNavigationItems(session),
    isAuthenticated: Boolean(session?.user?.id),
    isAdmin: isAdminRole(session?.user?.role),
  });
}
