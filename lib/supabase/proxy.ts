import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

// Rutas accesibles sin autenticación
const PUBLIC_ROUTES = ["/", "/terminos", "/privacidad", "/login", "/auth"];

// Rutas que requieren auth pero NO requieren onboarding completo
const ONBOARDING_EXEMPT_ROUTES = ["/onboarding", "/api"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function updateSession(request: NextRequest) {
  // If the env vars are not set, skip proxy check
  if (!hasEnvVars) {
    return NextResponse.next({ request });
  }

  // Track cookies that Supabase needs to set on the response
  let pendingCookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          pendingCookies = cookiesToSet;
        },
      },
    },
  );

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getClaims().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  // Helper to build final response with cookies + optional custom request headers
  const buildResponse = (customHeaders?: Record<string, string>) => {
    const requestHeaders = new Headers(request.headers);
    if (customHeaders) {
      for (const [key, value] of Object.entries(customHeaders)) {
        requestHeaders.set(key, value);
      }
    }
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
    return response;
  };

  // Public routes — allow without auth
  if (isPublicRoute(pathname)) {
    return buildResponse();
  }

  // No user on protected route — redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Admin routes — verify admin role
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.sub)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/discover";
      return NextResponse.redirect(url);
    }
  }

  // Onboarding gate — redirect to /onboarding if not completed
  const isOnboardingExempt = ONBOARDING_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isOnboardingExempt) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("user_id", user.sub)
      .single();

    if (userProfile && !userProfile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Centralized subscription check — available to all authenticated routes
  // via x-user-id and x-subscription-plan request headers
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("plan, status")
    .eq("user_id", user.sub)
    .eq("status", "active")
    .single();

  const plan = subscription?.plan || "free";

  return buildResponse({
    "x-user-id": user.sub as string,
    "x-subscription-plan": plan,
  });
}
