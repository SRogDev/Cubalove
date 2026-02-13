export const SUBSCRIPTION_LIMITS = {
  free: {
    likesPerPeriod: 100, // per 12 hours
    superlikesPerDay: 1,
    canRewind: false,
    canSeeLikes: false,
    hasVipBadge: false,
    priorityBoost: 1.0,
  },
  plus: {
    likesPerPeriod: 100, // per 12 hours
    superlikesPerDay: 5,
    canRewind: true,
    canSeeLikes: true,
    hasVipBadge: false,
    priorityBoost: 1.0,
  },
  vip: {
    likesPerPeriod: Infinity, // unlimited
    superlikesPerDay: 15,
    canRewind: true,
    canSeeLikes: true,
    hasVipBadge: true,
    priorityBoost: 1.0,
    freeBoostsPerMonth: 1,
  },
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_LIMITS;

export function getPlanLimits(plan: string) {
  return SUBSCRIPTION_LIMITS[plan as PlanKey] ?? SUBSCRIPTION_LIMITS.free;
}

/** Report reason keys (DB: English, UI: Spanish) */
export const REPORT_REASONS = {
  fake: "Perfil falso",
  inappropriate: "Contenido inapropiado",
  harassment: "Acoso / lenguaje ofensivo",
  minor: "Es menor de edad",
  spam: "Spam / bot",
  other: "Otro",
} as const;

export type ReportReasonKey = keyof typeof REPORT_REASONS;
