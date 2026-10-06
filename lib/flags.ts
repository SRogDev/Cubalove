/**
 * Feature flags — Cubalove.
 *
 * NEXT_PUBLIC_ENABLE_COUPLE_MODE: set to "true" to enable the couple mode
 * (/pareja route + components/couple/*). Default is OFF: the app launches
 * as a dating-only app while the couple mode stays fully in the codebase
 * (components, routes, DB tables) for later reactivation.
 *
 * NOTE: NEXT_PUBLIC_ vars are inlined at build time — changing this flag
 * requires a rebuild. It is documented here (not in .env.example) to avoid
 * merge conflicts with a parallel PR that edits that file.
 */
export const COUPLE_MODE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_COUPLE_MODE === "true";
