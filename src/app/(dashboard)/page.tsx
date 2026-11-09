"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  GitMerge,
  ArrowRightLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
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

export default function DashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
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
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500 font-medium">Aggregating campus indicators...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalRegistered: 0,
    activeMembers: 0,
    allocatedMembersCount: 0,
    unallocatedMembersCount: 0,
    allocationRatePercent: 0,
    deaconCount: 0,
    totalTransfers: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>BRS v1.0 Autonomous Allocation Engine Active</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Executive Campus Overview</h2>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            Real-time tracking of registrations, eligibility filters, department capacities, and proposal approval workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/allocation"
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-md hover:bg-indigo-50 transition flex items-center gap-2"
          >
            <GitMerge className="w-4 h-4 text-indigo-600" />
            <span>Run Allocation Engine</span>
          </Link>
          <Link
            href="/members"
            className="px-4 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-medium text-xs border border-indigo-500/40 transition flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Manage Members</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Members</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{summary.totalRegistered}</div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">{summary.activeMembers} active</span> members in campus
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Allocated Members</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{summary.allocatedMembersCount}</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${summary.allocationRatePercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-slate-800">{summary.allocationRatePercent}%</span> of active population placed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unassigned Pool</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{summary.unallocatedMembersCount}</div>
          <p className="text-xs text-slate-500 mt-1">
            Eligible candidates awaiting batch run or review
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Consecrated Deacons</span>
            <Building2 className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{summary.deaconCount}</div>
          <p className="text-xs text-slate-500 mt-1">
            Deacon qualification verified for altar service
          </p>
        </div>
      </div>

      {/* Department Capacity & Targets Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Department Capacity & Utilization</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fixed capacity limits ($M_d$) and active member placements per department
            </p>
          </div>
          <Link
            href="/departments"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Manage Departments <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.departments.map((dept) => {
            const isFull = dept.activeCount >= dept.maxCapacity;
            return (
              <div
                key={dept.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-slate-900 truncate">{dept.name}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                    {dept.code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span>
                    <strong>{dept.activeCount}</strong> / {dept.maxCapacity} members
                  </span>
                  <span className={`font-semibold ${isFull ? "text-red-600" : "text-slate-700"}`}>
                    {dept.capacityPercent}% capacity
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isFull ? "bg-red-500" : dept.capacityPercent > 70 ? "bg-amber-500" : "bg-indigo-600"
                    }`}
                    style={{ width: `${Math.min(dept.capacityPercent, 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                  <span>Target: {Math.round(dept.targetPercent * 100)}%</span>
                  <span>{dept.availableSlots} slots open</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/allocation"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
            <GitMerge className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Intelligent Allocation Engine</h4>
          <p className="text-xs text-slate-500 mt-1">
            Generate autonomous proposed assignments with explainability trails and approval checkpoints.
          </p>
        </Link>

        <Link
          href="/import"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Excel Ingestion Pipeline</h4>
          <p className="text-xs text-slate-500 mt-1">
            Drag-and-drop spreadsheets with duplicate phone/ID detection and staging reconciliation.
          </p>
        </Link>

        <Link
          href="/transfers"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:bg-violet-600 group-hover:text-white transition">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Controlled Department Reassignment</h4>
          <p className="text-xs text-slate-500 mt-1">
            Transfer members with destination capacity verification and atomic history tracking.
          </p>
        </Link>
      </div>
    </div>
  );
}

