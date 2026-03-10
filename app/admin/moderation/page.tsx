"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModerationUserItem } from "./user-item";

interface UserWithReports {
  user_id: string;
  display_name: string;
  gender: string;
  status: string;
  role: string;
  created_at: string;
  last_active: string;
  report_count: number;
}

const TABS = [
  { id: "all", label: "Todos los usuarios", icon: Users },
  { id: "reported", label: "Más reportados", icon: AlertTriangle },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [users, setUsers] = useState<UserWithReports[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const reportedUsers = [...users]
    .filter((u) => u.report_count > 0)
    .sort((a, b) => b.report_count - a.report_count);

  const displayedUsers = activeTab === "all" ? users : reportedUsers;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Moderación</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestionar usuarios y reportes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === "reported" && reportedUsers.length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/10 px-1 text-xs font-bold text-destructive">
                  {reportedUsers.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : displayedUsers.length > 0 ? (
        <div className="space-y-3">
          {displayedUsers.map((user) => (
            <ModerationUserItem
              key={user.user_id}
              user={user}
              reportCount={user.report_count}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert
            size={32}
            className="text-muted-foreground mb-3"
          />
          <p className="text-sm text-muted-foreground">
            {activeTab === "reported"
              ? "No hay usuarios reportados"
              : "No hay usuarios registrados"}
          </p>
        </div>
      )}
    </div>
  );
}
