import {
  ADMIN_ROLE,
  USER_ROLE,
  type FeatureFlagState,
  type UserRole,
} from "@/lib/features";

export type FeatureAccessInput = {
  feature: FeatureFlagState;
  role: string | null | undefined;
  isAuthenticated: boolean;
  userPreferenceEnabled?: boolean;
};

export function isAdminRole(role: string | null | undefined) {
  return role === ADMIN_ROLE;
}

export function normalizeUserRole(role: string | null | undefined): UserRole {
  return role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE;
}

export function canAccessFeature({
  feature,
  role,
  isAuthenticated,
  userPreferenceEnabled,
}: FeatureAccessInput) {
  if (!isAuthenticated) {
    return feature.guestEnabled;
  }

  const roleAllowed =
    normalizeUserRole(role) === ADMIN_ROLE
      ? feature.adminEnabled
      : feature.userEnabled;

  if (!roleAllowed) {
    return false;
  }

  if (feature.kind !== "page") {
    return true;
  }

  return userPreferenceEnabled !== false;
}
