import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getSessionFeatureAccess } from "@/lib/feature-access";
import { isFeatureKey } from "@/lib/features";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feature = searchParams.get("feature");

  if (!feature || !isFeatureKey(feature)) {
    return NextResponse.json(
      { error: "Valid feature key is required" },
      { status: 400 }
    );
  }

  const session = await getServerAuthSession();

  return NextResponse.json({
    allowed: await getSessionFeatureAccess(session, feature),
    isAuthenticated: Boolean(session?.user?.id),
  });
}
