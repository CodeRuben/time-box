import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { isAdminRole } from "@/lib/feature-access-rules";
import { UserSettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <UserSettingsClient isAdmin={isAdminRole(session.user.role)} />;
}
