"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin");
    router.refresh();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="sticky top-0 z-40 border-b border-dark-border bg-dark-card/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-white">
            Admin
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              View Site
            </Link>
            {!isLoginPage && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-primary"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      {!isLoginPage && (
        <nav className="border-b border-dark-border bg-dark-card/50">
          <div className="container mx-auto px-4 flex gap-6 py-2">
            <Link
              href="/admin/dashboard"
              className={`text-sm py-2 ${pathname === "/admin/dashboard" ? "text-primary" : "text-gray-400 hover:text-white"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/posts"
              className={`text-sm py-2 ${pathname?.startsWith("/admin/posts") ? "text-primary" : "text-gray-400 hover:text-white"}`}
            >
              Posts
            </Link>
            <Link
              href="/admin/matches"
              className={`text-sm py-2 ${pathname?.startsWith("/admin/matches") ? "text-primary" : "text-gray-400 hover:text-white"}`}
            >
              Matches
            </Link>
            <Link
              href="/admin/ads"
              className={`text-sm py-2 ${pathname === "/admin/ads" ? "text-primary" : "text-gray-400 hover:text-white"}`}
            >
              Ads
            </Link>
            <Link
              href="/admin/pages"
              className={`text-sm py-2 ${pathname?.startsWith("/admin/pages") ? "text-primary" : "text-gray-400 hover:text-white"}`}
            >
              Pages
            </Link>
          </div>
        </nav>
      )}
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
