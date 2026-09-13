"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { usePraxisStore } from "@/store/usePraxisStore";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/repo", label: "Connect" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
];

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "text-muted bg-white/5" },
  pro: { label: "Pro", className: "text-accent bg-accent/10 shadow-glow-sm" },
  team: { label: "Team", className: "text-accentViolet bg-accentViolet/10" },
};

function PraxisLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <path fill="#4488ff" fillRule="evenodd" d="
        M 80.5,37.4
        L 91.1,41.3 L 91.1,58.7 L 80.5,62.6
        L 85.2,72.9 L 72.9,85.2 L 62.6,80.5
        L 58.7,91.1 L 41.3,91.1 L 37.4,80.5
        L 27.1,85.2 L 14.8,72.9 L 19.5,62.6
        L 8.9,58.7 L 8.9,41.3 L 19.5,37.4
        L 14.8,27.1 L 27.1,14.8 L 37.4,19.5
        L 41.3,8.9 L 58.7,8.9 L 62.6,19.5
        L 72.9,14.8 L 85.2,27.1 L 80.5,37.4 Z
        M 50,32 A 18,18 0 0,1 50,68 A 18,18 0 0,1 50,32 Z
        M 50,43 A 7,7 0 0,1 50,57 A 7,7 0 0,1 50,43 Z
      "/>
    </svg>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const chatOpen = usePraxisStore((state) => state.chatOpen);
  const setChatOpen = usePraxisStore((state) => state.setChatOpen);
  const currentAnalysisId = usePraxisStore((state) => state.currentAnalysisId);

  const planId = (session?.user as any)?.planId ?? "free";
  const isPro = planId === "pro" || planId === "team";
  const badge = PLAN_BADGE[planId] ?? PLAN_BADGE.free;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 md:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-100">
          <PraxisLogo className="w-6 h-6" />
          PRAKSYS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 text-sm text-slate-300">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 transition duration-200 border ${
                isActive(item.href)
                  ? "text-accent bg-accent/10 shadow-glow-sm border-accent/25"
                  : "border-transparent hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {currentAnalysisId && (
            <button
              onClick={() => {
                if (!isPro) { window.location.href = "/pricing"; return; }
                setChatOpen(!chatOpen);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 transition duration-200 border ${
                chatOpen
                  ? "bg-accent/15 text-accent shadow-glow-sm border-accent/25"
                  : "border-transparent hover:bg-slate-800/70 hover:text-white"
              }`}
              title={isPro ? "AI Codebase Chat" : "Upgrade to Pro for AI Chat"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {!isPro && <span className="text-xs text-accentViolet">Pro</span>}
            </button>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-200 ${
                  menuOpen
                    ? "border-accent/40 bg-accent/10 shadow-glow-sm"
                    : "border-slate-700/60 bg-panel hover:border-accent/30"
                }`}
              >
                {session.user.image && (
                  <img src={session.user.image} alt="Avatar" className="w-5 h-5 rounded-full" />
                )}
                <span className={`hidden sm:inline text-xs font-semibold px-1.5 py-0.5 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
                <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-accent/20 bg-panel shadow-glow-sm z-50 overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-xs font-medium text-white truncate">{session.user.name}</p>
                    <p className="text-xs text-muted truncate">{session.user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-accent/10 hover:text-accent transition-colors"
                  >
                    Account & Billing
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      // Revoke GitHub's authorization for this app first, so the next
                      // sign-in shows GitHub's authorize page instead of silently
                      // reusing whichever account is already logged into GitHub.
                      try {
                        await fetch("/api/auth/disconnect-github", { method: "POST" });
                      } catch {
                        // Sign out anyway even if the revoke call fails.
                      }
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm text-accent hover:shadow-glow-sm hover:border-accent/50 transition-all duration-200"
            >
              Sign In
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col items-center justify-center w-9 h-9 gap-1.5 rounded-lg border border-slate-700/60 bg-panel hover:border-accent/30 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-4 h-0.5 bg-slate-300 transition-all duration-200 origin-center ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-4 h-0.5 bg-slate-300 transition-all duration-200 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block w-4 h-0.5 bg-slate-300 transition-all duration-200 origin-center ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-bg/95 backdrop-blur-xl animate-fadeIn">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2.5 text-sm transition duration-200 border ${
                  isActive(item.href)
                    ? "text-accent bg-accent/10 border-accent/25 shadow-glow-sm"
                    : "text-slate-300 border-transparent hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {currentAnalysisId && (
              <button
                onClick={() => {
                  if (!isPro) { window.location.href = "/pricing"; return; }
                  setChatOpen(!chatOpen);
                  setMobileOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition duration-200 border ${
                  chatOpen
                    ? "bg-accent/15 text-accent border-accent/25"
                    : "text-slate-300 border-transparent hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                AI Chat {!isPro && <span className="text-xs text-accentViolet">Pro</span>}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
