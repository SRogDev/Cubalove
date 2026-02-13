"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Newspaper, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const COUPLE_NAV_ITEMS = [
  {
    href: "/chismes",
    label: "Chismes",
    icon: Newspaper,
  },
  {
    href: "/pareja",
    label: "Pareja",
    icon: Heart,
  },
] as const;

export const CoupleNav = () => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md safe-bottom"
      role="navigation"
      aria-label="Navegación modo pareja"
    >
      <div className="mx-auto flex h-[var(--bottom-nav-height)] max-w-lg items-center justify-around px-2">
        {COUPLE_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl px-6 py-2 transition-colors",
                "touch-action-manipulation min-w-[80px]",
                "hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "transition-transform",
                  isActive && "scale-110"
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
