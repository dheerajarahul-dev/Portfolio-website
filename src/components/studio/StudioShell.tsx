"use client";

// StudioShell — the main application frame: collapsible sidebar + topbar + content area
// This is a pure client component that accepts the session from a server parent

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  MessageSquare,
  PlaySquare,
  HardDrive,
  CheckSquare,
  Users,
  Building2,
  BarChart2,
  Settings,
  Film,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  Plus,
  Shield,
  Globe,
  ExternalLink,
} from "lucide-react";
import type { StudioSession } from "@/lib/studio-types";
import { STUDIO_NAV_ITEMS } from "@/lib/studio-permissions";

// Map icon name string → lucide component
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  FolderKanban,
  Layers,
  MessageSquare,
  PlaySquare,
  HardDrive,
  CheckSquare,
  Users,
  Building2,
  BarChart2,
  Settings,
  Film,
};

interface StudioShellProps {
  session: StudioSession;
  children: React.ReactNode;
}

export default function StudioShell({ session, children }: StudioShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Filter nav items by role
  const navItems = STUDIO_NAV_ITEMS.filter((item) =>
    item.roles.includes(session.role)
  );

  // Fetch unread notification count
  useEffect(() => {
    let mounted = true;
    const load = () => {
      fetch("/api/studio/notifications?unread=true")
        .then((r) => r.json())
        .then((d) => {
          if (mounted && d.success) setUnreadCount(d.data.unreadCount);
        })
        .catch(() => null);
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch("/api/studio/auth", { method: "DELETE" });
    router.push("/studio/login");
  }, [router]);

  function isActive(href: string) {
    if (href === "/studio/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <aside
      className={`
        flex flex-col h-full bg-[#111113] border-r border-white/[0.06]
        transition-all duration-200
        ${collapsed ? "w-[60px]" : "w-[220px]"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-white/[0.06]">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Film className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-semibold text-sm tracking-tight truncate">
              Creative X
            </div>
            <div className="text-zinc-500 text-[11px] truncate">Studio</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group
                ${active
                  ? "bg-violet-600/15 text-violet-400"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"}`}
              />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!collapsed && item.badge === "notifications" && unreadCount > 0 && (
                <span className="bg-violet-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-2 border-t border-white/[0.06] mt-2 space-y-0.5">
          <Link
            href="/admin"
            className={`
              flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group
              text-zinc-400 hover:text-purple-300 hover:bg-purple-500/10
            `}
            title={collapsed ? "CMS Admin Panel" : undefined}
          >
            <Shield className="w-4 h-4 flex-shrink-0 text-purple-400 group-hover:text-purple-300" />
            {!collapsed && <span className="truncate flex-1">CMS Admin</span>}
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group
              text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]
            `}
            title={collapsed ? "Live Portfolio Website" : undefined}
          >
            <Globe className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
            {!collapsed && (
              <span className="truncate flex-1 flex items-center justify-between">
                <span>Live Site</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* User section + collapse toggle */}
      <div className="border-t border-white/[0.06] p-2 space-y-1">
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors text-sm"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>

        {/* User button */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
              {session.displayName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-white text-xs font-medium truncate">{session.displayName}</div>
                <div className="text-zinc-500 text-[11px] truncate">{session.role.replace("_", " ")}</div>
              </div>
            )}
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1a1e] border border-white/[0.08] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-white/[0.06]">
                  <div className="text-white text-sm font-medium truncate">{session.displayName}</div>
                  <div className="text-zinc-400 text-xs truncate">{session.email}</div>
                </div>
                <div className="p-1">
                  <Link
                    href="/studio/profile"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-300 hover:bg-white/[0.06] text-sm transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-purple-300 hover:bg-purple-950/30 text-sm transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Shield className="w-4 h-4 text-purple-400" />
                    CMS Admin
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-300 hover:bg-white/[0.06] text-sm transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Globe className="w-4 h-4 text-zinc-400" />
                    Live Website
                  </Link>
                  {session.role === "super_admin" && (
                    <Link
                      href="/studio/settings"
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-300 hover:bg-white/[0.06] text-sm transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-red-400 hover:bg-red-950/40 text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {loggingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">{sidebarContent}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex w-[220px]">{sidebarContent}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#09090b] flex-shrink-0">
          {/* Mobile menu button */}
          <button
            className="md:hidden text-zinc-400 hover:text-white transition-colors p-1"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search (placeholder — global search coming in Phase 2) */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="search"
                placeholder="Search projects, tasks, files…"
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/60 border border-white/[0.06] rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Quick create */}
          {(session.role === "super_admin" || session.role === "manager" || session.role === "editor") && (
            <Link
              href="/studio/projects/new"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Link>
          )}

          {/* Notifications */}
          <Link
            href="/studio/inbox"
            className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
            )}
          </Link>

          {/* Profile avatar (mobile) */}
          <div className="md:hidden">
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-semibold">
              {session.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
