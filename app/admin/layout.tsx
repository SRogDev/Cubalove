"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Megaphone,
  BarChart3,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/recharges", label: "Recargas", icon: CreditCard },
  { href: "/admin/ads", label: "Chismes Ads", icon: Megaphone },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/moderation", label: "Moderación", icon: ShieldAlert },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link
              href="/discover"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              aria-label="Volver a la app"
            >
              <ArrowLeft size={16} />
            </Link>
            <h1 className="font-display text-lg font-bold">
              Admin Panel
            </h1>
          </div>
          <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
            ADMIN
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl flex">
        {/* Sidebar nav (desktop) */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border/50 min-h-[calc(100vh-3.5rem)] p-3 gap-1">
          {ADMIN_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full border-b border-border/50">
          <nav className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
            {ADMIN_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors shrink-0",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
