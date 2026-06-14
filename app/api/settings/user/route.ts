import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import {
  canAccessFeature,
  getFeatureFlagMap,
  getUserPreferenceMap,
  setUserFeaturePreference,
} from "@/lib/feature-access";
import { PAGE_FEATURES, isFeatureKey, type FeatureKey } from "@/lib/features";

type PreferenceUpdate = {
  key?: unknown;
  enabled?: unknown;
};

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 }
  );
}

async function getUserSettings(userId: string, role: string) {
  const flags = await getFeatureFlagMap();
  const preferences = await getUserPreferenceMap(userId);

  return PAGE_FEATURES.map((feature) => {
    const flag = flags.get(feature.key)!;
    const globallyAvailable = canAccessFeature({
      feature: flag,
      role,
      isAuthenticated: true,
      userPreferenceEnabled: true,
    });
    const preferenceEnabled = preferences.get(feature.key) !== false;

    return {
      key: feature.key,
      label: feature.label,
      description: feature.description,
      href: feature.href,
      globallyAvailable,
      enabled: globallyAvailable && preferenceEnabled,
    };
  });
}

function parsePreferenceUpdate(raw: unknown):
  | { data: { key: FeatureKey; enabled: boolean } }
  | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "Invalid settings payload" };
  }

  const update = raw as PreferenceUpdate;

  if (typeof update.key !== "string" || !isFeatureKey(update.key)) {
    return { error: "Invalid feature key" };
  }

  if (!PAGE_FEATURES.some((feature) => feature.key === update.key)) {
    return { error: "Only page preferences can be changed here" };
  }

  if (typeof update.enabled !== "boolean") {
    return { error: "Preference must be a boolean" };
  }

  return {
    data: {
      key: update.key,
      enabled: update.enabled,
    },
  };
}

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  return NextResponse.json({
    preferences: await getUserSettings(session.user.id, session.user.role),
  });
}

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const result = parsePreferenceUpdate(raw);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const flags = await getFeatureFlagMap();
  const globallyAvailable = canAccessFeature({
    feature: flags.get(result.data.key)!,
    role: session.user.role,
    isAuthenticated: true,
    userPreferenceEnabled: true,
  });

  if (result.data.enabled && !globallyAvailable) {
    return NextResponse.json(
      { error: "This feature is disabled by an administrator" },
      { status: 403 }
    );
  }

  await setUserFeaturePreference(
    session.user.id,
    result.data.key,
    result.data.enabled
  );

  return NextResponse.json({
    preferences: await getUserSettings(session.user.id, session.user.role),
  });
}
