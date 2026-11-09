"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Check,
} from "lucide-react";

interface ImportRow {
  rowNumber: number;
  fullName: string;
  phoneNumber: string;
  gender: string;
  category: string;
  isDeacon: boolean;
  registrationNo?: string;
  isValid: boolean;
  validationErrors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
}

interface AnalysisResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: ImportRow[];
}

export default function ImportExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setAnalysis(null);
    setStatusMessage(null);

    // Auto-analyze staged preview
    const formData = new FormData();
    formData.append("file", selected);
    formData.append("commit", "false");

    setAnalyzing(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze Excel file");
      }

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error analyzing spreadsheet",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirmImport() {
    if (!file || !analysis) return;
    setCommitting(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("commit", "true");

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit import");
      }

      setStatusMessage({
        type: "success",
        text: data.message || "Excel records successfully imported into the campus registry!",
      });

      setFile(null);
      setAnalysis(null);
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Commit error",
      });
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Excel Data Ingestion Pipeline</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Multi-stage bulk registration with column mapping, duplicate detection, and staged preview
          reconciliation (BRS Section 8).
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* File Upload Drop Area */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 p-8 text-center transition">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <h3 className="font-bold text-sm text-slate-900">Upload Spreadsheet (.xlsx, .csv)</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Expected headers: <code>Full Name</code>, <code>Phone Number</code>, <code>Gender</code>,{" "}
            <code>Category</code>, <code>Deacon Status</code>.
          </p>

          <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition">
            <Upload className="w-4 h-4" />
            <span>Select File to Analyze</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-3 text-xs text-slate-600 font-medium">
              Selected: <strong className="text-slate-900">{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          {analyzing && (
            <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600 font-semibold">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Validating and reconciling records...</span>
            </div>
          )}
        </div>
      </div>

      {/* Staged Reconciliation Preview */}
      {analysis && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <span>Staged Reconciliation Summary</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified rows before committing into the permanent campus database.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={committing || analysis.validCount === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{committing ? "Importing Records..." : `Commit Valid Records (${analysis.validCount})`}</span>
            </button>
          </div>

          {/* Counts Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold block">Total Rows In File</span>
              <span className="text-2xl font-bold text-slate-900">{analysis.totalRows}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] text-emerald-700 font-semibold block">Valid New Members</span>
              <span className="text-2xl font-bold text-emerald-800">{analysis.validCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-[11px] text-amber-700 font-semibold block">Duplicate Detected (Skipped)</span>
              <span className="text-2xl font-bold text-amber-800">{analysis.duplicateCount}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100">
              <span className="text-[11px] text-red-700 font-semibold block">Format Errors (Rejected)</span>
              <span className="text-2xl font-bold text-red-800">{analysis.invalidCount}</span>
            </div>
          </div>

          {/* Staged Rows Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Row #</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Gender / Category</th>
                  <th className="px-4 py-3">Deacon</th>
                  <th className="px-4 py-3">Reconciliation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.rows.slice(0, 50).map((r) => (
                  <tr
                    key={r.rowNumber}
                    className={`hover:bg-slate-50/60 transition ${
                      r.isDuplicate ? "bg-amber-50/40" : !r.isValid ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-500">{r.rowNumber}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{r.fullName || "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{r.phoneNumber || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {r.gender} · {r.category}
                    </td>
                    <td className="px-4 py-2.5">{r.isDeacon ? "Yes" : "No"}</td>
                    <td className="px-4 py-2.5">
                      {r.isValid && !r.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Valid for import</span>
                        </span>
                      ) : r.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{r.duplicateReason}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          <span>{r.validationErrors.join(", ")}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

