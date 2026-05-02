import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes – anyone can access (only the landing page and about)
  const publicPaths = ["/", "/about"];

  // Also allow static assets and Next.js internals
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api");

  if (publicPaths.includes(pathname) || isStatic) {
    return NextResponse.next();
  }

  // All other routes require authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to homepage with modal trigger
    const signInUrl = new URL("/?auth=login", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes – extra security
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("trust_score")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.trust_score < 90) {
      const notAllowedUrl = new URL("/", request.url);
      notAllowedUrl.searchParams.set("error", "admin_access_denied");
      return NextResponse.redirect(notAllowedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};