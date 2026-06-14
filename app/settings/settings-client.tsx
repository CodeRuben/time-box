"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { FeatureKey } from "@/lib/features";
import { AdminSettingsSection } from "./admin-settings-section";
import {
  SettingsAlert,
  SettingsList,
  SettingsLoadingState,
  SettingsPageIntro,
  SettingsPanel,
  SettingsPanelHeader,
  SettingsRow,
  SettingsSaveStatus,
  SettingsStatusBadge,
  SettingsSwitch,
  type SettingsSaveState,
} from "./settings-ui";

type UserPreference = {
  key: FeatureKey;
  label: string;
  description: string;
  href: string;
  globallyAvailable: boolean;
  enabled: boolean;
};

type UserSettingsResponse = {
  preferences?: UserPreference[];
  error?: string;
};

type UserSettingsClientProps = {
  isAdmin: boolean;
};

function UserWorkspaceSettings({
  onSaveStateChange,
}: {
  onSaveStateChange?: (state: SettingsSaveState) => void;
}) {
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/settings/user");
        const result = (await response.json()) as UserSettingsResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load settings");
        }

        if (!cancelled) {
          setPreferences(result.preferences ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load settings"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onSaveStateChange?.({
      isLoading,
      isSaving: savingKey !== null,
    });
  }, [isLoading, savingKey, onSaveStateChange]);

  async function updatePreference(
    preference: UserPreference,
    enabled: boolean
  ) {
    const nextPreference = { ...preference, enabled };
    setPreferences((current) =>
      current.map((item) =>
        item.key === preference.key ? nextPreference : item
      )
    );
    setSavingKey(preference.key);
    setError("");

    try {
      const response = await fetch("/api/settings/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: preference.key,
          enabled,
        }),
      });
      const result = (await response.json()) as UserSettingsResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save settings");
      }
    } catch (saveError) {
      setPreferences((current) =>
        current.map((item) =>
          item.key === preference.key ? preference : item
        )
      );
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings"
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <>
      {error ? <SettingsAlert>{error}</SettingsAlert> : null}

      <SettingsPanel>
        <SettingsPanelHeader
          icon={SlidersHorizontal}
          title="Your workspace"
          description="Toggle the pages you want available in navigation and direct links."
        />

        {isLoading ? (
          <SettingsLoadingState message="Loading your settings..." />
        ) : (
          <SettingsList>
            {preferences.map((preference) => (
              <SettingsRow
                key={preference.key}
                title={preference.label}
                description={preference.description}
                meta={
                  !preference.globallyAvailable ? (
                    <SettingsStatusBadge label="Locked" tone="muted" />
                  ) : preference.enabled ? (
                    <SettingsStatusBadge label="Visible" tone="success" />
                  ) : (
                    <SettingsStatusBadge label="Hidden" tone="neutral" />
                  )
                }
              >
                <SettingsSwitch
                  checked={preference.enabled}
                  disabled={!preference.globallyAvailable}
                  label={`Show ${preference.label}`}
                  onCheckedChange={(enabled) =>
                    void updatePreference(preference, enabled)
                  }
                />
              </SettingsRow>
            ))}
          </SettingsList>
        )}
      </SettingsPanel>
    </>
  );
}

export function UserSettingsClient({ isAdmin }: UserSettingsClientProps) {
  const [saveState, setSaveState] = useState<SettingsSaveState>({
    isLoading: true,
    isSaving: false,
  });

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <SettingsPageIntro
          title="Settings"
          description={
            isAdmin
              ? "Manage global feature access for admins, users, and guests."
              : "Choose which pages appear in your workspace."
          }
          action={
            !saveState.isLoading ? (
              <SettingsSaveStatus isSaving={saveState.isSaving} />
            ) : null
          }
        />

        {isAdmin ? (
          <AdminSettingsSection onSaveStateChange={setSaveState} />
        ) : (
          <UserWorkspaceSettings onSaveStateChange={setSaveState} />
        )}
      </div>
    </main>
  );
}
