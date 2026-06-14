import type { Session } from "next-auth";
import {
  FEATURES,
  PAGE_FEATURES,
  getDefaultFeatureFlag,
  isFeatureKey,
  type FeatureFlagState,
  type FeatureKey,
} from "@/lib/features";
import {
  canAccessFeature,
  isAdminRole,
  type FeatureAccessInput,
} from "@/lib/feature-access-rules";
import { prisma } from "@/lib/prisma";

type DbFeatureFlag = {
  key: string;
  adminEnabled: boolean;
  userEnabled: boolean;
  guestEnabled: boolean;
};

type DbUserPreference = {
  featureKey: string;
  enabled: boolean;
};

export { canAccessFeature, isAdminRole, type FeatureAccessInput };

function normalizeFeatureFlag(row: DbFeatureFlag): FeatureFlagState | null {
  if (!isFeatureKey(row.key)) {
    return null;
  }

  const defaultFlag = getDefaultFeatureFlag(row.key);

  return {
    ...defaultFlag,
    adminEnabled: row.adminEnabled,
    userEnabled: row.userEnabled,
    guestEnabled: row.guestEnabled,
  };
}

export async function getFeatureFlagMap() {
  const flags = new Map<FeatureKey, FeatureFlagState>(
    FEATURES.map((feature) => [
      feature.key,
      getDefaultFeatureFlag(feature.key),
    ])
  );

  const rows = await prisma.featureFlag.findMany({
    where: {
      key: {
        in: FEATURES.map((feature) => feature.key),
      },
    },
  });

  for (const row of rows) {
    const flag = normalizeFeatureFlag(row);
    if (flag) {
      flags.set(flag.key, flag);
    }
  }

  return flags;
}

export async function getAllFeatureFlags() {
  const flags = await getFeatureFlagMap();
  return FEATURES.map((feature) => flags.get(feature.key)!);
}

export async function getUserPreferenceMap(userId: string) {
  const preferences = new Map<FeatureKey, boolean>(
    PAGE_FEATURES.map((feature) => [feature.key, true])
  );

  const rows: DbUserPreference[] = await prisma.userFeaturePreference.findMany({
    where: {
      userId,
      featureKey: {
        in: PAGE_FEATURES.map((feature) => feature.key),
      },
    },
    select: {
      featureKey: true,
      enabled: true,
    },
  });

  for (const row of rows) {
    if (isFeatureKey(row.featureKey)) {
      preferences.set(row.featureKey, row.enabled);
    }
  }

  return preferences;
}

export async function getSessionFeatureAccess(
  session: Session | null,
  featureKey: FeatureKey,
  options: { includeUserPreference?: boolean } = {}
) {
  const flags = await getFeatureFlagMap();
  const feature = flags.get(featureKey)!;
  const userId = session?.user?.id;
  const includeUserPreference = options.includeUserPreference ?? true;
  const preferences =
    includeUserPreference && userId ? await getUserPreferenceMap(userId) : null;

  return canAccessFeature({
    feature,
    role: session?.user?.role,
    isAuthenticated: Boolean(userId),
    userPreferenceEnabled: preferences?.get(featureKey),
  });
}

export async function getNavigationItems(session: Session | null) {
  const flags = await getFeatureFlagMap();
  const preferences = session?.user?.id
    ? await getUserPreferenceMap(session.user.id)
    : null;

  return PAGE_FEATURES.filter((feature) =>
    canAccessFeature({
      feature: flags.get(feature.key)!,
      role: session?.user?.role,
      isAuthenticated: Boolean(session?.user?.id),
      userPreferenceEnabled: preferences?.get(feature.key),
    })
  ).map((feature) => ({
    href: feature.href,
    label: feature.label,
    key: feature.key,
  }));
}

export async function setFeatureFlag(
  key: FeatureKey,
  data: Pick<FeatureFlagState, "adminEnabled" | "userEnabled" | "guestEnabled">
) {
  await prisma.featureFlag.upsert({
    where: { key },
    update: data,
    create: {
      key,
      ...data,
    },
  });
}

export async function setUserFeaturePreference(
  userId: string,
  featureKey: FeatureKey,
  enabled: boolean
) {
  await prisma.userFeaturePreference.upsert({
    where: {
      userId_featureKey: {
        userId,
        featureKey,
      },
    },
    update: { enabled },
    create: {
      userId,
      featureKey,
      enabled,
    },
  });
}
