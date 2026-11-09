import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users2,
  LogOut,
  Church,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    ...(hasPermission("campus.view") ? [{ to: "/campuses", label: "Campuses", icon: Building2 }] : []),
    ...(hasPermission("user.manage") ? [{ to: "/users", label: "Users & Roles", icon: Users2 }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-tight">C-CIMAS</h1>
            <p className="text-xs text-indigo-300 font-medium">Enterprise Management</p>
          </div>
        </div>

        {/* Active Campus Scope Pill */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 text-xs">
          <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider">
            Active Campus Scope
          </span>
          <span className="font-medium text-slate-200 truncate block">
            {user?.campusName || "All Campuses (Super Admin)"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
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

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Church Campus Registration & Intelligent Allocation Management System
          </span>

          <div className="flex items-center gap-2 font-medium text-xs text-slate-700">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Role: </span>
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
              {user?.role}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
