"use client";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  ShoppingBag,
  TrendingDown,
  PiggyBank,
  Trophy,
  Sparkles,
  Bell,
  Settings as SettingsIcon,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Check,
} from "lucide-react";
import { api } from "@/lib/client";
import { useApiQuery, useApiMutation, qk } from "@/lib/query";

export interface ShellUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatar: string | null;
  role: string;
  theme: string | null;
  accentColor: string | null;
}

type RecentNotification = { id: number; title: string; message: string | null; read: boolean };

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/purchases", label: "Purchase Planner", icon: ShoppingBag },
  { href: "/tracker", label: "Price Tracker", icon: TrendingDown },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/assistant", label: "Chloe · AI", icon: Sparkles },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function applyTheme(theme: string, accent?: string | null) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("lg_theme", theme);
    if (accent) {
      localStorage.setItem("lg_accent", accent);
      document.documentElement.style.setProperty("--accent", accent);
    }
  } catch {
    /* ignore */
  }
}

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/assistant", label: "Chloe", icon: Sparkles },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/settings", label: "More", icon: Menu },
];

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => (user.theme === "light" ? "light" : "dark"));
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    applyTheme(theme, user.accentColor);
  }, [theme, user.accentColor]);

  const lockScroll = useCallback(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => lockScroll(), [lockScroll]);

  const { data: notifData } = useApiQuery<{ notifications: RecentNotification[]; unread: number }>(
    qk.notifications,
    "/api/notifications",
    { refetchInterval: 45_000 }
  );

  const unread = notifData?.unread ?? 0;
  const recent = notifData?.notifications?.slice(0, 6) ?? [];

  const markAllRead = useApiMutation(
    () => api("/api/notifications", { method: "POST", body: { all: true } }),
    { invalidate: [qk.notifications] }
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    api("/api/settings", { method: "POST", body: { theme: next } }).catch(() => {});
  };

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.push("/login");
    router.refresh();
  };

  const nav = [...NAV];
  if (user.role === "admin") nav.push({ href: "/admin", label: "Admin Panel", icon: Shield });

  const SidebarInner = (
    <div className="flex flex-col h-full">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1.5 mb-4">
        <div className="w-9 h-9 rounded-xl grid place-items-center text-white font-bold"
          style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #2563eb))" }}>
          L
        </div>
        <div>
          <div className="font-bold leading-tight">LifeOS</div>
          <div className="text-[0.65rem] text-muted leading-tight">Goals & Shopping</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`nav-link ${active ? "active" : ""}`}>
              <Icon size={18} /> <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="glass-soft p-3 mt-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full grid place-items-center text-lg shrink-0"
          style={{ background: "color-mix(in srgb, var(--accent) 22%, transparent)" }}>
          {user.avatar || "🙂"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{user.fullName}</div>
          <div className="text-[0.7rem] text-muted truncate">@{user.username}</div>
        </div>
        <button onClick={logout} title="Log out" className="btn-icon btn-ghost btn">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 p-4 z-30">{SidebarInner}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 p-4 glass" style={{ borderRadius: 0 }}>
            <button className="btn-icon btn-ghost btn absolute top-3 right-3" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center gap-3 backdrop-blur-md"
          style={{ background: "color-mix(in srgb, var(--bg) 70%, transparent)", borderBottom: "1px solid var(--border)" }}>
          <button className="btn-icon btn-ghost btn lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button onClick={toggleTheme} className="btn-icon btn-ghost btn" title="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative">
            <button onClick={() => setShowNotif((s) => !s)} className="btn-icon btn-ghost btn relative">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center text-[0.6rem] font-bold rounded-full text-white pulse-dot"
                  style={{ background: "var(--danger)" }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] glass p-3 z-40 fade-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Notifications</span>
                  {unread > 0 && (
                    <button onClick={() => markAllRead.mutate()} className="text-xs text-soft hover:underline inline-flex items-center gap-1">
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar">
                  {recent.length === 0 && <p className="text-sm text-muted py-4 text-center">You&apos;re all caught up 🎉</p>}
                  {recent.map((n) => (
                    <Link key={n.id} href="/notifications" onClick={() => setShowNotif(false)}
                      className={`block p-2.5 rounded-xl text-sm hover:bg-[var(--surface)] ${!n.read ? "border-l-2 pl-3" : ""}`}
                      style={!n.read ? { borderColor: "var(--accent)" } : undefined}>
                      <div className="font-semibold text-xs">{n.title}</div>
                      {n.message && <div className="text-xs text-soft mt-0.5">{n.message}</div>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6 pb-24 lg:pb-6 max-w-7xl mx-auto">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t"
        style={{ borderRadius: 0, paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around px-2 py-1.5">
          {MOBILE_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[0.65rem] font-medium transition-colors ${active ? "text-[var(--accent)]" : "text-muted"}`}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
