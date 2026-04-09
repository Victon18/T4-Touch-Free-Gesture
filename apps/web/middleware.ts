import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ── Protected routes (require authentication) ─────────────────────────────────
const PROTECTED_PATHS = ["/home", "/control", "/model"];

// ── Auth-only routes (redirect authenticated users away) ──────────────────────
const AUTH_PATHS = ["/signin", "/signup"];

// ── Rate limiting store (in-memory, per Edge runtime) ─────────────────────────
// Simple sliding-window counter keyed by IP + route prefix
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Array<{ path: string; max: number; windowMs: number }> = [
  { path: "/api/auth/signup", max: 5,  windowMs: 60_000 },
  { path: "/api/auth/signin", max: 10, windowMs: 60_000 },
  { path: "/api/",            max: 60, windowMs: 60_000 },
];

function checkRateLimit(ip: string, pathname: string): boolean {
  const rule = RATE_LIMITS.find((r) => pathname.startsWith(r.path));
  if (!rule) return true; // no limit for this path

  const key = `${ip}:${rule.path}`;
  const now  = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > rule.max) return false;
  return true;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rate limiting on API routes ────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";

    if (!checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // ── 2. Authorization: protect private pages ────────────────────────────────
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage  = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected || isAuthPage) {
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET ?? "secret",
    });

    if (isProtected && !token) {
      // Not authenticated → redirect to sign-in
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (isAuthPage && token) {
      // Already authenticated → redirect to home
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
