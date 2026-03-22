import { getServerAuthSession } from "@/lib/auth";

export async function getAuthenticatedUserId() {
  const session = await getServerAuthSession();
  return session?.user?.id ?? null;
}
