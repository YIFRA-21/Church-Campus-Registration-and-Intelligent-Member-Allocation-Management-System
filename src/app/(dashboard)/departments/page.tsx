"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Target,
  Users,
  Shield,
  Sliders,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  targetPercent: number;
  maxCapacity: number;
  priority: number;
  status: string;
  currentActiveAllocationsCount: number;
  capacityUtilizationPercent: number;
  eligibilityRules: {
    allowedGenders: string;
    allowedCategories: string;
    requiresDeacon: boolean | null;
  }[];
  balancingRules: {
    constraintType: string;
    targetMaleRatio: number | null;
    targetFemaleRatio: number | null;
  }[];
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    targetPercent: 0.25,
    maxCapacity: 30,
    priority: 1,
    allowedGenders: "ALL",
    allowedCategories: "ALL",
    requiresDeacon: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadDepartments() {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requiresDeacon: formData.requiresDeacon ? true : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create department");
      }

      setShowModal(false);
      loadDepartments();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Creation error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Departments & Capacity Rules</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure target percentages (p_d), fixed capacity maximums (M_d), and eligibility constraints.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Department</span>
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading departments...</div>
        ) : (
          departments.map((dept) => {
            const rule = dept.eligibilityRules[0];
            const isFull = dept.currentActiveAllocationsCount >= dept.maxCapacity;

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        {dept.code}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 mt-1.5">{dept.name}</h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Priority #{dept.priority}
                    </span>
                  </div>

                  {dept.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{dept.description}</p>
                  )}

                  {/* Target & Capacity Bar */}
                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Placed Members:
                      </span>
                      <span className="font-bold text-slate-900">
                        {dept.currentActiveAllocationsCount} / {dept.maxCapacity}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFull
                            ? "bg-red-500"
                            : dept.capacityUtilizationPercent > 80
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${Math.min(dept.capacityUtilizationPercent, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Target: {Math.round(dept.targetPercent * 100)}% of eligible pool</span>
                      <span className="font-semibold text-slate-700">{dept.capacityUtilizationPercent}% utilized</span>
                    </div>
                  </div>

                  {/* Configured Eligibility Rules */}
                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block">
                      Eligibility Rules
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        Gender: {rule?.allowedGenders || "ALL"}
                      </span>

                      {rule?.requiresDeacon && (
                        <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-[11px] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Deacon Required
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        Categories:{" "}
                        {rule?.allowedCategories === "ALL"
                          ? "All Categories"
                          : (() => {
                              try {
                                return JSON.parse(rule.allowedCategories).join(", ");
                              } catch {
                                return rule?.allowedCategories;
                              }
                            })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Remaining slots: {Math.max(0, dept.maxCapacity - dept.currentActiveAllocationsCount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Create New Department</h3>
                <p className="text-xs text-slate-500">Configure department capacity and candidate criteria</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Media & Broadcast"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MEDIA"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Department purpose and scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target % (p_d)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="1.0"
                    required
                    value={formData.targetPercent}
                    onChange={(e) => setFormData({ ...formData, targetPercent: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity (M_d)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Rank</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Eligibility Constraints</span>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allowed Gender</label>
                  <select
                    value={formData.allowedGenders}
                    onChange={(e) => setFormData({ ...formData, allowedGenders: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All Genders (Male & Female)</option>
                    <option value="MALE">Male Only</option>
                    <option value="FEMALE">Female Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="deptDeaconCheck"
                    checked={formData.requiresDeacon}
                    onChange={(e) => setFormData({ ...formData, requiresDeacon: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="deptDeaconCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Strict Requirement: Member must be an ordained Deacon
                  </label>
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
                  {submitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
