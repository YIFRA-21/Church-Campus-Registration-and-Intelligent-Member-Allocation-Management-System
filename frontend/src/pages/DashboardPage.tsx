import React from "react";
import { useAuth } from "../context/AuthContext";
import { Church, ShieldCheck, LogOut, CheckCircle2, Building2, UserCheck } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Church className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 leading-tight">C-CIMAS Portal</h1>
            <p className="text-xs text-slate-500">Church Campus Registration & Allocation</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{user?.fullName}</div>
            <div className="text-[11px] font-mono text-slate-500">
              {user?.role} · {user?.campusName || "Global"}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-50 transition"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Module 1: Authentication & RBAC Active</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.fullName}</h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            You are securely authenticated via Supabase JWT with capability-scoped permissions and PostgreSQL Row Level Security (RLS).
          </p>
        </div>

        {/* Identity & Tenancy Context Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Assigned Role</span>
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{user?.role}</div>
            <p className="text-xs text-slate-500 mt-1">Role-based access controls active</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Active Campus Scope</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{user?.campusName || "All Campuses"}</div>
            <p className="text-xs text-slate-500 mt-1">Tenant isolation enforced via RLS</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Granted Capabilities</span>
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{user?.permissions.length} Tokens</div>
            <p className="text-xs text-slate-500 mt-1">Fine-grained operational permissions</p>
          </div>
        </div>

        {/* Granted Capabilities Tag Cloud */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Active Capability Permissions</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {user?.permissions.map((perm) => (
              <span
                key={perm}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-medium border border-slate-200"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

