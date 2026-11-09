import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUsers, fetchRoles, createUser } from "../api/user.api";
import { fetchCampuses } from "../api/campus.api";
import { UserItem, RoleDefinition, CreateUserPayload } from "../types/user";
import { Campus } from "../types/campus";
import { Users2, ShieldCheck, UserPlus, CheckCircle2, Lock, X, Shield } from "lucide-react";

export const UsersPage: React.FC = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateUserPayload>({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    role: "REGISTRATION_OFFICER",
    campusId: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [uList, rList, cList] = await Promise.all([
        fetchUsers(token),
        fetchRoles(token),
        fetchCampuses(token),
      ]);
      setUsers(uList);
      setRoles(rList);
      setCampuses(cList);
      if (user?.campusId) {
        setFormData((prev) => ({ ...prev, campusId: user.campusId }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);

    try {
      await createUser(formData, token);
      setShowModal(false);
      setFormData({
        email: "",
        password: "",
        fullName: "",
        phoneNumber: "",
        role: "REGISTRATION_OFFICER",
        campusId: user?.campusId || null,
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">User & Role Governance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative personnel, role allocations, and capability permission tokens.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>New User Account</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Users2 className="w-4 h-4 text-indigo-600" />
            <span>Active Administrative Users</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{users.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Full Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Campus Organization</th>
                <th className="px-5 py-3">Capabilities</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading administrative accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{u.fullName}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{u.campusName || "Global (All Campuses)"}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {u.permissions.length} tokens
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Primary Role Architecture Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Six Primary Roles & Default Permission Catalogs</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div key={r.name} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70">
              <div className="font-bold text-xs text-slate-900 flex items-center justify-between mb-1">
                <span>{r.title}</span>
                <span className="text-[10px] font-mono text-indigo-600">{r.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">{r.description}</p>
              <div className="flex flex-wrap gap-1">
                {r.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 rounded bg-white text-slate-600 text-[9px] font-mono border border-slate-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Create Administrative User</h3>
                <p className="text-xs text-slate-500">Assign role capabilities and campus tenancy</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deacon Michael Hailu"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@c-cimas.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {roles
                      .filter((r) => user?.role === "SUPER_ADMIN" || r.name !== "SUPER_ADMIN")
                      .map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus *</label>
                  <select
                    value={formData.campusId || ""}
                    onChange={(e) => setFormData({ ...formData, campusId: e.target.value || null })}
                    disabled={user?.role !== "SUPER_ADMIN"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                  >
                    {user?.role === "SUPER_ADMIN" && <option value="">Global (All Campuses)</option>}
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
