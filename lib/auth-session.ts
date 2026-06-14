import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getSessionFeatureAccess, isAdminRole } from "@/lib/feature-access";
import type { FeatureKey } from "@/lib/features";

export async function getAuthenticatedUserId() {
  const session = await getServerAuthSession();
  return session?.user?.id ?? null;
}

export async function getAuthenticatedSession() {
  return (await getServerAuthSession())?.user ?? null;
}

export async function getAdminUserId() {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    return null;
  }

  return session.user.id;
}

export type FeatureUserAccess =
  | { userId: string; response?: never }
  | { userId?: never; response: NextResponse };

export async function requireFeatureUser(
  featureKey: FeatureKey,
  forbiddenMessage: string
): Promise<FeatureUserAccess> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const allowed = await getSessionFeatureAccess(session, featureKey, {
    includeUserPreference: false,
  });

  if (!allowed) {
    return {
      response: NextResponse.json({ error: forbiddenMessage }, { status: 403 }),
    };
  }

  return { userId: session.user.id };
}
