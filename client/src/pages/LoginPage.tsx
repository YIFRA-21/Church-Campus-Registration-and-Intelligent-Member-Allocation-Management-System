import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Church, ShieldCheck, UserCheck, ArrowRight, Lock, Mail, Users } from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@c-cimas.org");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const selectDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/40 mb-4">
            <Church className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">C-CIMAS Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Church Campus Registration & Intelligent Allocation Management System
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@c-cimas.org"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Selector */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick-Select Demo Role (Password: admin123)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => selectDemoRole("admin@c-cimas.org")}
              className={`p-2 rounded-lg border text-left transition ${
                email === "admin@c-cimas.org"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Super Admin
              </div>
              <div className="text-[10px] text-slate-400">admin@...</div>
            </button>

            <button
              onClick={() => selectDemoRole("campusadmin@c-cimas.org")}
              className={`p-2 rounded-lg border text-left transition ${
                email === "campusadmin@c-cimas.org"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="font-semibold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Campus Admin
              </div>
              <div className="text-[10px] text-slate-400">campusadmin@...</div>
            </button>

            <button
              onClick={() => selectDemoRole("regofficer@c-cimas.org")}
              className={`p-2 rounded-lg border text-left transition ${
                email === "regofficer@c-cimas.org"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="font-semibold">Reg. Officer</div>
              <div className="text-[10px] text-slate-400">regofficer@...</div>
            </button>

            <button
              onClick={() => selectDemoRole("choirlead@c-cimas.org")}
              className={`p-2 rounded-lg border text-left transition ${
                email === "choirlead@c-cimas.org"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="font-semibold">Dept Manager</div>
              <div className="text-[10px] text-slate-400">choirlead@...</div>
            </button>

            <button
              onClick={() => selectDemoRole("evaluator@c-cimas.org")}
              className={`p-2 rounded-lg border text-left transition ${
                email === "evaluator@c-cimas.org"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="font-semibold">Evaluator</div>
              <div className="text-[10px] text-slate-400">evaluator@...</div>
            </button>

            <button
              onClick={() => selectDemoRole("auditor@c-cimas.org")}
              className={`p-2 rounded-lg border text-left transition ${
                email === "auditor@c-cimas.org"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="font-semibold">Auditor</div>
              <div className="text-[10px] text-slate-400">auditor@...</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

