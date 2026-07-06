export const USER_ROLE = "USER";
export const ADMIN_ROLE = "ADMIN";

export type UserRole = typeof USER_ROLE | typeof ADMIN_ROLE;

export const FEATURES = [
  {
    key: "planner",
    label: "Planner",
    description: "Daily timeboxing, priorities, focus list, and reminders.",
    href: "/",
    kind: "page",
    defaults: {
      adminEnabled: true,
      userEnabled: true,
      guestEnabled: true,
    },
  },
  {
    key: "workouts",
    label: "Workouts",
    description: "Workout tracking, history, summaries, and exports.",
    href: "/workout-tracker",
    kind: "page",
    defaults: {
      adminEnabled: true,
      userEnabled: true,
      guestEnabled: true,
    },
  },
  {
    key: "reading-journal",
    label: "Book log",
    description: "Track books, daily reading entries, and progress.",
    href: "/reading-journal",
    kind: "page",
    defaults: {
      adminEnabled: true,
      userEnabled: true,
      guestEnabled: false, // signed-in only — see docs/adr/0001
    },
  },
  {
    key: "registration",
    label: "New user registration",
    description: "Allow visitors to create new accounts.",
    href: "/register",
    kind: "system",
    defaults: {
      adminEnabled: true,
      userEnabled: true,
      guestEnabled: true,
    },
  },
] as const;

export type Feature = (typeof FEATURES)[number];
export type FeatureKey = Feature["key"];
export type FeatureKind = Feature["kind"];

export type FeatureFlagState = {
  key: FeatureKey;
  label: string;
  description: string;
  kind: FeatureKind;
  href: string;
  adminEnabled: boolean;
  userEnabled: boolean;
  guestEnabled: boolean;
};

const FEATURE_KEYS = new Set<string>(FEATURES.map((feature) => feature.key));

export const PAGE_FEATURES = FEATURES.filter((feature) => feature.kind === "page");

export function isFeatureKey(value: string): value is FeatureKey {
  return FEATURE_KEYS.has(value);
}

export function getFeature(key: FeatureKey) {
  return FEATURES.find((feature) => feature.key === key)!;
}

export function getFeatureByHref(href: string) {
  return PAGE_FEATURES.find((feature) => feature.href === href);
}

export function getDefaultFeatureFlag(key: FeatureKey): FeatureFlagState {
  const feature = getFeature(key);

  return {
    key,
    label: feature.label,
    description: feature.description,
    kind: feature.kind,
    href: feature.href,
    ...feature.defaults,
  };
}
