"use client";

import { BarChart3, TrendingUp, Heart, Users, Sparkles } from "lucide-react";
import type { AdminInsight } from "@/lib/types";

// Mock insights — en producción se calcularán con queries reales
const MOCK_INSIGHTS: AdminInsight[] = [
  {
    id: "1",
    title: "Gym + Mujeres = Doble Match",
    description:
      "Las chicas que tienen 'Gym' en sus intereses hacen x2 más matches que las demás. Parece que el fitness conecta.",
    category: "matching",
    value: "x2 matches",
  },
  {
    id: "2",
    title: "La ropa vieja conecta corazones",
    description:
      "El 68% de las conversaciones que llevan a match comienzan hablando de comida cubana. La ropa vieja es el tema #1.",
    category: "engagement",
    value: "68%",
  },
  {
    id: "3",
    title: "Matches LGBTQ+",
    description:
      "El 5% de los matches totales han sido entre personas del mismo sexo. La comunidad LGBTQ+ crece en la plataforma.",
    category: "demographics",
    value: "5%",
  },
  {
    id: "4",
    title: "Hora pico: Viernes 9pm",
    description:
      "Los viernes entre 9pm y 11pm se generan 3x más matches que cualquier otro horario. Los cubanos saben cuándo buscar.",
    category: "engagement",
    value: "3x más",
  },
  {
    id: "5",
    title: "Vedado lidera en matches",
    description:
      "Los usuarios del Vedado tienen 40% más matches que el promedio. La zona más activa de La Habana.",
    category: "demographics",
    value: "+40%",
  },
  {
    id: "6",
    title: "Super Likes funcionan",
    description:
      "Los Super Likes tienen 3x más probabilidades de convertirse en match comparado con likes normales.",
    category: "matching",
    value: "3x conversión",
  },
  {
    id: "7",
    title: "Músicos arrasan",
    description:
      "Los usuarios que ponen 'Música' o 'Salsa' en sus intereses reciben 25% más likes. El ritmo cubano enamora.",
    category: "matching",
    value: "+25% likes",
  },
  {
    id: "8",
    title: "Crecimiento semanal",
    description:
      "Promedio de 142 nuevos registros semanales en el último mes. El boca a boca está funcionando.",
    category: "growth",
    value: "142/semana",
  },
  {
    id: "9",
    title: "Retención de usuarios",
    description:
      "El 74% de los usuarios que hacen su primer match vuelven a la app al día siguiente. Los matches generan engagement.",
    category: "engagement",
    value: "74% retención",
  },
  {
    id: "10",
    title: "Fotos importan",
    description:
      "Los perfiles con 3+ fotos reciben 2.5x más likes que los perfiles con solo 1 foto. Más fotos, más oportunidades.",
    category: "matching",
    value: "2.5x más likes",
  },
];

const CATEGORY_CONFIG: Record<
  string,
  { icon: typeof Heart; color: string; label: string }
> = {
  matching: {
    icon: Heart,
    color: "text-primary bg-primary/10",
    label: "Matching",
  },
  demographics: {
    icon: Users,
    color: "text-info bg-info/10",
    label: "Demografía",
  },
  engagement: {
    icon: Sparkles,
    color: "text-gold bg-gold/10",
    label: "Engagement",
  },
  growth: {
    icon: TrendingUp,
    color: "text-success bg-success/10",
    label: "Crecimiento",
  },
};

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Insights curiosos de la comunidad — úsalos para crear contenido en Chismes
        </p>
      </div>

      {/* Category filters would go here in future */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {MOCK_INSIGHTS.length} insights disponibles
        </span>
      </div>

      {/* Insights grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {MOCK_INSIGHTS.map((insight) => {
          const config = CATEGORY_CONFIG[insight.category];
          const Icon = config?.icon ?? BarChart3;
          return (
            <div
              key={insight.id}
              className="rounded-2xl border border-border/50 bg-card p-4 md:p-5 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${config?.color}`}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {config?.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-primary whitespace-nowrap">
                  {insight.value}
                </span>
              </div>
              <h3 className="font-display font-semibold text-sm mb-1">
                {insight.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-muted/50 border border-border/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Estos insights se generarán automáticamente con datos reales de la base de datos.
          Por ahora son datos de ejemplo para inspirar contenido.
        </p>
      </div>
    </div>
  );
}
