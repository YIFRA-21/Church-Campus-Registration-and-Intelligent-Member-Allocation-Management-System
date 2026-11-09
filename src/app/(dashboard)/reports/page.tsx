"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  PieChart,
  Users,
  Building2,
  TrendingUp,
  Percent,
} from "lucide-react";

interface ReportData {
  summary: {
    totalRegistered: number;
    activeMembers: number;
    allocatedMembersCount: number;
    unallocatedMembersCount: number;
    allocationRatePercent: number;
    deaconCount: number;
    totalTransfers: number;
  };
  departments: {
    id: string;
    name: string;
    code: string;
    targetPercent: number;
    maxCapacity: number;
    activeCount: number;
    capacityPercent: number;
    availableSlots: number;
  }[];
  demographics: {
    gender: { male: number; female: number; maleRatio: number; femaleRatio: number };
    categories: Record<string, number>;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">Loading evaluation reports...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Evaluation & Business Indicators</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Comprehensive performance monitoring: Target achievement vs. capacity utilization, demographics,
          and transfer metrics (BRS Section 9).
        </p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Overall Placement</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data.summary.allocationRatePercent}%</div>
          <p className="text-xs text-slate-500 mt-1">
            {data.summary.allocatedMembersCount} of {data.summary.activeMembers} active members placed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Departments</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data.departments.length}</div>
          <p className="text-xs text-slate-500 mt-1">Active ministries and service units</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Deacon Consecration</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data.summary.deaconCount}</div>
          <p className="text-xs text-slate-500 mt-1">Ordained liturgical servants</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Approved Transfers</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data.summary.totalTransfers}</div>
          <p className="text-xs text-slate-500 mt-1">Recorded departmental reassignments</p>
        </div>
      </div>

      {/* Target Achievement vs Fixed Capacity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Department Targets vs Fixed Capacity Utilization</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Distinguishes percentage target p_d from fixed maximum capacity M_d (BRS Section 9).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Target %</th>
                <th className="px-4 py-3">Active Placements</th>
                <th className="px-4 py-3">Max Capacity</th>
                <th className="px-4 py-3">Capacity Utilization</th>
                <th className="px-4 py-3">Slots Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.departments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {d.name} <span className="font-mono text-slate-400 font-normal">({d.code})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {Math.round(d.targetPercent * 100)}%
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{d.activeCount}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{d.maxCapacity}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${Math.min(d.capacityPercent, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-slate-700">{d.capacityPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{d.availableSlots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demographics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Gender Distribution</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Recorded male and female representation across campus.</p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Male ({data.demographics.gender.male})</span>
                <span>{data.demographics.gender.maleRatio}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${data.demographics.gender.maleRatio}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Female ({data.demographics.gender.female})</span>
                <span>{data.demographics.gender.femaleRatio}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-pink-500 h-3 rounded-full"
                  style={{ width: `${data.demographics.gender.femaleRatio}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Member Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Member Classification Distribution</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown by registered age and social categories.</p>

          <div className="space-y-2.5">
            {Object.entries(data.demographics.categories).map(([cat, count]) => {
              const total = data.summary.totalRegistered;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500">{count} members</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[10px]">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
