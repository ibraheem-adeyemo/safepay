import { type NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/lib/session-edge";

// Routes that require a valid session
const PROTECTED = ["/dashboard", "/admin"];
// Routes that redirect authenticated users away (login/register)
const AUTH_ROUTES = ["/login", "/register"];
// Admin-only routes
const ADMIN_ROUTES = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("vl_session")?.value;
  const session = token ? await decryptSession(token) : null;

  const isAuthed = !!session;
  const isAdmin =
    session?.accountType === "ADMIN" ||
    session?.accountType === "SUPER_ADMIN";

  // Redirect authenticated users away from login/register
  if (isAuthed && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const dest = isAdmin ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Protect dashboard and admin — require auth
  if (!isAuthed && PROTECTED.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes — require admin role
  if (
    isAuthed &&
    !isAdmin &&
    ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|widget|t/).*)",
  ],
};
