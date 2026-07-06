import { describe, expect, it } from "vitest";
import { canAccessFeature } from "../feature-access-rules";
import { getDefaultFeatureFlag } from "../features";

describe("canAccessFeature", () => {
  it("allows guests when a feature is guest-enabled", () => {
    expect(
      canAccessFeature({
        feature: getDefaultFeatureFlag("planner"),
        role: null,
        isAuthenticated: false,
      })
    ).toBe(true);
  });

  it("blocks regular users when a feature is disabled for users", () => {
    expect(
      canAccessFeature({
        feature: {
          ...getDefaultFeatureFlag("workouts"),
          userEnabled: false,
        },
        role: "USER",
        isAuthenticated: true,
        userPreferenceEnabled: true,
      })
    ).toBe(false);
  });

  it("allows admins to test features disabled for regular users", () => {
    expect(
      canAccessFeature({
        feature: {
          ...getDefaultFeatureFlag("workouts"),
          userEnabled: false,
        },
        role: "ADMIN",
        isAuthenticated: true,
        userPreferenceEnabled: true,
      })
    ).toBe(true);
  });

  it("blocks page features when the user has disabled them personally", () => {
    expect(
      canAccessFeature({
        feature: getDefaultFeatureFlag("planner"),
        role: "USER",
        isAuthenticated: true,
        userPreferenceEnabled: false,
      })
    ).toBe(false);
  });

  it("ignores user page preferences for system features", () => {
    expect(
      canAccessFeature({
        feature: getDefaultFeatureFlag("registration"),
        role: "USER",
        isAuthenticated: true,
        userPreferenceEnabled: false,
      })
    ).toBe(true);
  });
});
