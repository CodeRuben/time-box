import { NextResponse } from "next/server";
import { getAdminUserId } from "@/lib/auth-session";
import {
  getAllFeatureFlags,
  setFeatureFlag,
} from "@/lib/feature-access";
import { isFeatureKey, type FeatureFlagState } from "@/lib/features";

type FlagUpdate = {
  key?: unknown;
  adminEnabled?: unknown;
  userEnabled?: unknown;
  guestEnabled?: unknown;
};

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Admin access required" },
    { status: 403 }
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function parseFlagUpdate(raw: unknown):
  | {
      data: Pick<
        FeatureFlagState,
        "key" | "adminEnabled" | "userEnabled" | "guestEnabled"
      >;
    }
  | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "Invalid settings payload" };
  }

  const update = raw as FlagUpdate;

  if (typeof update.key !== "string" || !isFeatureKey(update.key)) {
    return { error: "Invalid feature key" };
  }

  if (
    !isBoolean(update.adminEnabled) ||
    !isBoolean(update.userEnabled) ||
    !isBoolean(update.guestEnabled)
  ) {
    return { error: "Feature settings must be booleans" };
  }

  return {
    data: {
      key: update.key,
      adminEnabled: update.adminEnabled,
      userEnabled: update.userEnabled,
      guestEnabled: update.guestEnabled,
    },
  };
}

export async function GET() {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    return unauthorizedResponse();
  }

  return NextResponse.json({ flags: await getAllFeatureFlags() });
}

export async function PATCH(request: Request) {
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
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

  const result = parseFlagUpdate(raw);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await setFeatureFlag(result.data.key, {
    adminEnabled: result.data.adminEnabled,
    userEnabled: result.data.userEnabled,
    guestEnabled: result.data.guestEnabled,
  });

  return NextResponse.json({ flags: await getAllFeatureFlags() });
}
