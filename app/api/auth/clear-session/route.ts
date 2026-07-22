import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Clears a stale session cookie and redirects to login.
// Called by layouts when getSession() returns null but a cookie is still present
// (e.g. after a password change invalidated the old token). Route Handlers can
// modify cookies; Server Components cannot.
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("vl_session");
  return NextResponse.redirect(new URL("/login", request.url));
}
