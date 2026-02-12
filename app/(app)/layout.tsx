import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";

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
