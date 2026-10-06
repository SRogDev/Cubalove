import {
  Users,
  Heart,
  TrendingUp,
  DollarSign,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";

async function getAdminStats() {
  const supabase = await createServiceClient();

  const [usersRes, activeRes, matchesRes, paidRes, revenueRes, reportsRes] =
    await Promise.all([
      supabase.from("users").select("user_id", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("user_id", { count: "exact", head: true })
        .gte(
          "last_active",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      supabase.from("matches").select("id", { count: "exact", head: true }),
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("user_subscriptions").select("plan").eq("status", "active"),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const totalUsers = usersRes.count ?? 0;
  const activeUsers = activeRes.count ?? 0;
  const totalMatches = matchesRes.count ?? 0;
  const paidUsers = paidRes.count ?? 0;

  // Rough revenue estimation from active subscriptions
  const plans = revenueRes.data ?? [];
  const revenue = plans.reduce((sum, s) => {
    if (s.plan === "plus") return sum + 2;
    if (s.plan === "vip") return sum + 8;
    return sum;
  }, 0);

  const conversionRate =
    totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(2) : "0";

  const pendingReports = reportsRes.count ?? 0;

  return {
    totalUsers,
    activeUsers,
    totalMatches,
    paidUsers,
    revenue,
    conversionRate,
    pendingReports,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const STAT_CARDS = [
    {
      label: "Usuarios Totales",
      value: stats.totalUsers.toLocaleString("es-CU"),
      icon: Users,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Activos (7d)",
      value: stats.activeUsers.toLocaleString("es-CU"),
      icon: UserCheck,
      color: "text-success bg-success/10",
    },
    {
      label: "Matches Totales",
      value: stats.totalMatches.toLocaleString("es-CU"),
      icon: Heart,
      color: "text-coral bg-coral/10",
    },
    {
      label: "Usuarios de Pago",
      value: stats.paidUsers.toLocaleString("es-CU"),
      icon: CreditCard,
      color: "text-gold bg-gold/10",
    },
    {
      label: "Ingresos Estimados",
      value: `$${stats.revenue.toLocaleString("es-CU")}`,
      icon: DollarSign,
      color: "text-success bg-success/10",
    },
    {
      label: "% Conversión Pago",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: "text-info bg-info/10",
    },
  ];
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de Cubalove
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/50 bg-card p-4 md:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold font-display">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick overview */}
      <div className="mt-6 rounded-2xl border border-border/50 bg-card p-5">
        <h3 className="font-display font-semibold mb-3">Resumen</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span>{stats.pendingReports} reportes pendientes de revisión</span>
          </div>
        </div>
      </div>
    </div>
  );
}
