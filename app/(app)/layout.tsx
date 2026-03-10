import { headers } from "next/headers";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { AttentionUser } from "@/components/shared/attention-user";
import { createClient } from "@/lib/supabase/server";
import type { UserStatus } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  // Verificar si el usuario está suspendido o bloqueado
  if (userId) {
    const supabase = await createClient();
    const { data: user } = await supabase
      .from("users")
      .select("status, suspended_until")
      .eq("user_id", userId)
      .single();

    if (user && user.status !== "active") {
      return (
        <AttentionUser
          status={user.status as UserStatus}
          suspendedUntil={user.suspended_until}
        />
      );
    }
  }

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar />
      <main className="flex-1 pt-[var(--top-bar-height)] pb-[var(--bottom-nav-height)]">
        <div className="mx-auto max-w-lg h-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
