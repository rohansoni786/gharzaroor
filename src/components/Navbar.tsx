"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setIsLoggedIn(!!session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-black text-indigo-600">Gharzaroor.pk</h1>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-700">
          <Link
            href="/"
            className={pathname === "/" ? "text-indigo-600" : "hover:text-indigo-600 transition"}
          >
            Home
          </Link>
          <Link
            href="/listings"
            className={pathname === "/listings" ? "text-indigo-600" : "hover:text-indigo-600 transition"}
          >
            Browse Flats
          </Link>
          <Link
            href="/map"
            className={pathname === "/map" ? "text-indigo-600" : "hover:text-indigo-600 transition"}
          >
            Map View
          </Link>
          <Link
            href="/post-listing"
            className={pathname === "/post-listing" ? "text-indigo-600" : "hover:text-indigo-600 transition"}
          >
            Post Room
          </Link>
          <Link
            href="/wanted"
            className={pathname === "/wanted" ? "text-indigo-600" : "hover:text-indigo-600 transition"}
          >
            Wanted
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/?auth=login"
              className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}