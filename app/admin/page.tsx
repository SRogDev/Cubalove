"use client";

import {
  Users,
  Heart,
  TrendingUp,
  DollarSign,
  CreditCard,
  UserCheck,
} from "lucide-react";

// Mock admin stats — se reemplazará con queries reales a Supabase
const MOCK_STATS = {
  total_users: 5_247,
  active_users: 3_891,
  total_matches: 2_403,
  paid_users: 412,
  total_revenue: 1_856,
  conversion_rate: 7.85,
};

const STAT_CARDS = [
  {
    label: "Usuarios Totales",
    value: MOCK_STATS.total_users.toLocaleString("es-CU"),
    icon: Users,
    color: "text-primary bg-primary/10",
  },
  {
    label: "Usuarios Activos",
    value: MOCK_STATS.active_users.toLocaleString("es-CU"),
    icon: UserCheck,
    color: "text-success bg-success/10",
  },
  {
    label: "Matches Totales",
    value: MOCK_STATS.total_matches.toLocaleString("es-CU"),
    icon: Heart,
    color: "text-coral bg-coral/10",
  },
  {
    label: "Usuarios de Pago",
    value: MOCK_STATS.paid_users.toLocaleString("es-CU"),
    icon: CreditCard,
    color: "text-gold bg-gold/10",
  },
  {
    label: "Ingresos Totales",
    value: `$${MOCK_STATS.total_revenue.toLocaleString("es-CU")}`,
    icon: DollarSign,
    color: "text-success bg-success/10",
  },
  {
    label: "% Conversión Pago",
    value: `${MOCK_STATS.conversion_rate}%`,
    icon: TrendingUp,
    color: "text-info bg-info/10",
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de Empatando
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
        <h3 className="font-display font-semibold mb-3">Actividad Reciente</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span>142 nuevos registros esta semana</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>89 matches generados hoy</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-gold" />
            <span>12 nuevas suscripciones esta semana</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span>3 reportes pendientes de revisión</span>
          </div>
        </div>
      </div>
    </div>
  );
}
