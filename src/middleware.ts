import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes – anyone can access
  const publicPaths = ["/", "/about", "/auth"];
  
  // Also allow static assets and Next.js internals
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api");

  if (publicPaths.includes(pathname) || isStatic) {
    return NextResponse.next();
  }

  // Create Supabase client for auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            NextResponse.next().cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if no session
  if (!session) {
    const signInUrl = new URL("/?auth=login", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes – extra security check
  if (pathname.startsWith("/admin")) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("trust_score")
        .eq("id", session.user.id)
        .single();

      if (!profile || (profile as { trust_score: number }).trust_score < 90) {
        const notAllowedUrl = new URL("/", request.url);
        notAllowedUrl.searchParams.set("error", "admin_access_denied");
        return NextResponse.redirect(notAllowedUrl);
      }
    } catch {
      // If profile check fails, deny access
      const notAllowedUrl = new URL("/", request.url);
      notAllowedUrl.searchParams.set("error", "admin_access_denied");
      return NextResponse.redirect(notAllowedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except static files, images, and the home page
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
