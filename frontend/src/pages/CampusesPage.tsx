import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses, createCampus } from "../api/campus.api";
import { Campus, CreateCampusPayload } from "../types/campus";
import { Building2, Plus, Users, Landmark, CheckCircle2, X } from "lucide-react";

export const CampusesPage: React.FC = () => {
  const { token, user, hasPermission } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateCampusPayload>({
    code: "",
    name: "",
    city: "",
    address: "",
    phoneNumber: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await fetchCampuses(token);
      setCampuses(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading campuses");
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
      await createCampus(formData, token);
      setShowModal(false);
      setFormData({ code: "", name: "", city: "", address: "", phoneNumber: "", email: "" });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating campus");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Campus Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Multi-campus organizational hierarchy and administrative tenancy boundaries.
          </p>
        </div>

        {hasPermission("campus.manage") && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Campus</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Campuses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading campuses...</div>
        ) : campuses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No campuses found under your current authorization scope.
          </div>
        ) : (
          campuses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                    {c.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.city}{c.address ? ` · ${c.address}` : ""}</span>
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Members</span>
                    <strong className="text-slate-900 text-sm">{c.memberCount}</strong> registered
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Departments</span>
                    <strong className="text-slate-900 text-sm">{c.departmentCount}</strong> units
                  </div>
                </div>
              </div>

              {c.phoneNumber && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                  Phone: {c.phoneNumber}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Register Campus Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Register New Campus</h3>
                <p className="text-xs text-slate-500">Create a new autonomous church campus organization</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HAW-03"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hawassa"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hawassa Lakeside Campus"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Street / District location"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +251462200000"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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
                  {submitting ? "Saving..." : "Create Campus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
