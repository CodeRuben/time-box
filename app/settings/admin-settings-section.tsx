"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { FeatureFlagState, FeatureKey } from "@/lib/features";
import {
  SettingsAlert,
  SettingsGroupLabel,
  SettingsList,
  SettingsLoadingState,
  SettingsMiniSwitch,
  SettingsPanel,
  SettingsPanelHeader,
  SettingsRow,
  SettingsStatusBadge,
  type SettingsSaveState,
} from "./settings-ui";

type AdminSettingsResponse = {
  flags?: FeatureFlagState[];
  error?: string;
};

type ToggleField = "adminEnabled" | "userEnabled" | "guestEnabled";

const roleToggles: Array<{ field: ToggleField; label: string }> = [
  { field: "adminEnabled", label: "Admin" },
  { field: "userEnabled", label: "User" },
  { field: "guestEnabled", label: "Guest" },
];

function AdminFeatureRow({
  flag,
  isSaving,
  onToggle,
}: {
  flag: FeatureFlagState;
  isSaving: boolean;
  onToggle: (field: ToggleField, enabled: boolean) => void;
}) {
  return (
    <SettingsRow
      title={flag.label}
      description={flag.description}
      meta={
        <SettingsStatusBadge label={flag.kind} tone="neutral" compact />
      }
    >
      <div className="flex flex-wrap items-end justify-end gap-4 sm:gap-5">
        {roleToggles.map((role) => (
          <SettingsMiniSwitch
            key={role.field}
            checked={flag[role.field]}
            disabled={isSaving}
            label={role.label}
            onCheckedChange={(enabled) => onToggle(role.field, enabled)}
          />
        ))}
      </div>
    </SettingsRow>
  );
}

function AdminFeatureGroup({
  label,
  flags,
  savingKey,
  onToggle,
}: {
  label: string;
  flags: FeatureFlagState[];
  savingKey: FeatureKey | null;
  onToggle: (flag: FeatureFlagState, field: ToggleField, enabled: boolean) => void;
}) {
  if (flags.length === 0) {
    return null;
  }

  return (
    <>
      <SettingsGroupLabel>{label}</SettingsGroupLabel>
      <SettingsList>
        {flags.map((flag) => (
          <AdminFeatureRow
            key={flag.key}
            flag={flag}
            isSaving={savingKey === flag.key}
            onToggle={(field, enabled) => onToggle(flag, field, enabled)}
          />
        ))}
      </SettingsList>
    </>
  );
}

export function AdminSettingsSection({
  onSaveStateChange,
}: {
  onSaveStateChange?: (state: SettingsSaveState) => void;
}) {
  const [adminFlags, setAdminFlags] = useState<FeatureFlagState[]>([]);
  const [adminError, setAdminError] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [savingAdminKey, setSavingAdminKey] = useState<FeatureKey | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminSettings() {
      setIsAdminLoading(true);
      setAdminError("");

      try {
        const response = await fetch("/api/settings/admin");
        const result = (await response.json()) as AdminSettingsResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load admin settings");
        }

        if (!cancelled) {
          setAdminFlags(result.flags ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setAdminError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load admin settings"
          );
        }
      } finally {
        if (!cancelled) {
          setIsAdminLoading(false);
        }
      }
    }

    void loadAdminSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onSaveStateChange?.({
      isLoading: isAdminLoading,
      isSaving: savingAdminKey !== null,
    });
  }, [isAdminLoading, savingAdminKey, onSaveStateChange]);

  async function updateAdminFlag(
    flag: FeatureFlagState,
    field: ToggleField,
    enabled: boolean
  ) {
    const nextFlag = { ...flag, [field]: enabled };
    setAdminFlags((current) =>
      current.map((item) => (item.key === flag.key ? nextFlag : item))
    );
    setSavingAdminKey(flag.key);
    setAdminError("");

    try {
      const response = await fetch("/api/settings/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: nextFlag.key,
          adminEnabled: nextFlag.adminEnabled,
          userEnabled: nextFlag.userEnabled,
          guestEnabled: nextFlag.guestEnabled,
        }),
      });
      const result = (await response.json()) as AdminSettingsResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save admin settings");
      }
    } catch (saveError) {
      setAdminFlags((current) =>
        current.map((item) => (item.key === flag.key ? flag : item))
      );
      setAdminError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save admin settings"
      );
    } finally {
      setSavingAdminKey(null);
    }
  }

  const pageFlags = adminFlags.filter((flag) => flag.kind === "page");
  const systemFlags = adminFlags.filter((flag) => flag.kind === "system");

  return (
    <SettingsPanel>
      <SettingsPanelHeader
        icon={ShieldCheck}
        title="Administration"
        description="Manage global access for pages and platform features across admins, users, and guests."
        badge="Global"
      />

      {adminError ? (
        <div className="px-5 pt-5 sm:px-6">
          <SettingsAlert>{adminError}</SettingsAlert>
        </div>
      ) : null}

      {isAdminLoading ? (
        <SettingsLoadingState message="Loading administration settings..." />
      ) : (
        <div className="pb-1">
          <AdminFeatureGroup
            label="Pages"
            flags={pageFlags}
            savingKey={savingAdminKey}
            onToggle={updateAdminFlag}
          />
          <AdminFeatureGroup
            label="System"
            flags={systemFlags}
            savingKey={savingAdminKey}
            onToggle={updateAdminFlag}
          />
        </div>
      )}
    </SettingsPanel>
  );
}
