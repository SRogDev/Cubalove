import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
// import { AttentionUser } from "@/components/shared/attention-user";
// En producción, verificar status del usuario desde Supabase:
// const { data: user } = await supabase.from("users").select("status, suspended_until").eq("user_id", auth.uid()).single();
// if (user?.status !== "active") return <AttentionUser status={user.status} suspendedUntil={user.suspended_until} />;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
