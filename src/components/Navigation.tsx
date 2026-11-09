"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  GitMerge,
  ArrowRightLeft,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  LogOut,
  Church,
  Globe,
  UserCheck,
} from "lucide-react";
import { translations, Locale } from "@/lib/i18n/translations";

interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  campus?: { id: string; name: string; code: string } | null;
  department?: { id: string; name: string } | null;
  permissions: string[];
}

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);

  const t = translations[locale];

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/members", label: t.nav.members, icon: Users },
    { href: "/departments", label: t.nav.departments, icon: Building2 },
    { href: "/allocation", label: t.nav.allocation, icon: GitMerge },
    { href: "/transfers", label: t.nav.transfers, icon: ArrowRightLeft },
    { href: "/import", label: t.nav.importExcel, icon: FileSpreadsheet },
    { href: "/reports", label: t.nav.reports, icon: BarChart3 },
    { href: "/audit", label: t.nav.auditLogs, icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading C-CIMAS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100/70">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        {/* Logo / Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white leading-tight">C-CIMAS</h1>
            <p className="text-xs text-indigo-300 font-medium">Campus Management</p>
          </div>
        </div>

        {/* Campus Context Banner */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 text-xs">
          <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider">Active Campus</span>
          <span className="font-medium text-slate-200 truncate block">
            {user?.campus ? user.campus.name : "All Campuses (Super Admin)"}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLocale(locale === "en" ? "am" : "en")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{locale === "en" ? "አማርኛ (Amharic)" : "English"}</span>
            </button>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              {user?.fullName ? user.fullName[0] : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Church Campus Registration & Intelligent Allocation Management System
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Authenticated as: </span>
              <strong className="text-slate-900 font-semibold">{user?.fullName}</strong>
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

