import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCampuses } from "../api/campus.api";
import {
  downloadExcelTemplate,
  uploadExcelImport,
  fetchImportHistory,
  downloadErrorReport,
} from "../api/member.api";
import { Campus } from "../types/campus";
import {
  ImportResultSummary,
  ImportBatchHistoryItem,
} from "../types/member";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  History,
  FileText,
  X,
  FileCheck2,
} from "lucide-react";

export const ExcelImportPage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportResultSummary | null>(null);
  const [history, setHistory] = useState<ImportBatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Load campuses and import history
  useEffect(() => {
    async function init() {
      if (!token) return;
      try {
        const cList = await fetchCampuses(token);
        setCampuses(cList);
        if (cList.length > 0) {
          setSelectedCampusId(cList[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading campuses");
      }
    }
    init();
  }, [token]);

  const loadHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const list = await fetchImportHistory(token, selectedCampusId || undefined);
      setHistory(list);
    } catch (err: unknown) {
      console.error("Error loading import history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [token, selectedCampusId]);

  // Handle Download Template
  const handleDownloadTemplate = async () => {
    if (!token) return;
    setDownloadingTemplate(true);
    try {
      const blob = await downloadExcelTemplate(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "C-CIMAS-Member-Import-Template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const name = file.name.toLowerCase();
      if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
        setError("Please upload an Excel (.xlsx) or CSV (.csv) file.");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setImportSummary(null);
    }
  };

  // Handle Upload & Process
  const handleUpload = async () => {
    if (!token || !selectedFile || !selectedCampusId) {
      setError("Please select both a campus and a valid spreadsheet file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Read file as Base64 string
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(",")[1];
          const summary = await uploadExcelImport(
            selectedCampusId,
            selectedFile.name,
            base64String,
            token
          );
          setImportSummary(summary);
          await loadHistory();
        } catch (uploadErr: unknown) {
          setError(uploadErr instanceof Error ? uploadErr.message : "Import processing error");
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError("Error reading file.");
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload execution failed");
      setUploading(false);
    }
  };

  // Handle Download Error Report
  const handleDownloadErrors = async (batchId: string) => {
    if (!token) return;
    try {
      const blob = await downloadErrorReport(batchId, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `C-CIMAS-Import-Errors-${batchId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to download error report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner with Cyan Digital Mesh Texture */}
      <div
        className="rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden bg-cover bg-center flex flex-col md:flex-row md:items-center justify-between gap-5"
        style={{
          backgroundColor: "#020617",
          backgroundImage:
            "linear-gradient(135deg, rgba(2, 6, 23, 0.92) 0%, rgba(15, 23, 42, 0.88) 50%, rgba(30, 58, 138, 0.82) 100%), url('/assets/c-cimas-cyan-mesh.jpg')",
          border: "1px solid rgba(59, 130, 246, 0.35)",
          boxShadow: "0 20px 25px -5px rgba(2, 6, 23, 0.5)",
        }}
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>High-Capacity Ingestion Pipeline (5,000–50,000+ Members)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Excel & CSV Member Data Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Batch-processed schema validation, deduplication, field normalization, and detailed row-by-row error reporting.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
          className="relative z-10 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition hover:scale-105 shrink-0"
        >
          <Download className="w-4 h-4 text-white" />
          <span>{downloadingTemplate ? "Generating Template..." : "Download Official Template"}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Box Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">Upload Spreadsheet File</h3>
            <p className="text-xs text-slate-500">Supported formats: Microsoft Excel (.xlsx), Comma-Separated Values (.csv)</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Building2 className="w-4 h-4 text-blue-900" />
            <span className="font-semibold text-slate-700">Target Campus:</span>
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="font-bold text-blue-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Drop / Selection Zone */}
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-700 rounded-2xl p-8 text-center bg-slate-50/50 transition">
          <input
            type="file"
            id="excel-file-input"
            accept=".xlsx, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3 shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="font-bold text-sm text-slate-900">
              {selectedFile ? selectedFile.name : "Click to select or drag & drop spreadsheet file"}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready for validation`
                : "Up to 50,000 member records supported via batch processing"}
            </span>
          </label>
        </div>

        {/* Upload Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null);
                setImportSummary(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-900/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{uploading ? "Validating & Processing Batches..." : "Validate & Import Records"}</span>
          </button>
        </div>
      </div>

      {/* IMPORT RESULT SUMMARY BANNER */}
      {importSummary && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  importSummary.importedRows > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {importSummary.importedRows > 0 ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Import Summary: {importSummary.status}
                </h3>
                <p className="text-xs text-slate-500">
                  Batch ID: <span className="font-mono">{importSummary.batchId}</span>
                </p>
              </div>
            </div>

            {importSummary.errors.length > 0 && (
              <button
                onClick={() => handleDownloadErrors(importSummary.batchId)}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Error Report (.xlsx)</span>
              </button>
            )}
          </div>

          {/* 6 Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rows</span>
              <strong className="text-xl font-bold text-slate-900">{importSummary.totalRows}</strong>
            </div>

            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Valid Rows</span>
              <strong className="text-xl font-bold text-emerald-800">{importSummary.validRows}</strong>
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Imported</span>
              <strong className="text-xl font-bold text-blue-900">{importSummary.importedRows}</strong>
            </div>

            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Duplicates</span>
              <strong className="text-xl font-bold text-amber-800">{importSummary.duplicateRows}</strong>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-100">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Invalid Rows</span>
              <strong className="text-xl font-bold text-rose-800">{importSummary.invalidRows}</strong>
            </div>

            <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-100">
              <span className="text-[10px] uppercase font-bold text-red-700 block">Failed Records</span>
              <strong className="text-xl font-bold text-red-800">{importSummary.failedRows}</strong>
            </div>
          </div>

          {/* Row-by-Row Error Inspector */}
          {importSummary.errors.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  Validation Error Details ({importSummary.errors.length} issues detected)
                </h4>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-2">Row #</th>
                      <th className="px-4 py-2">Member ID</th>
                      <th className="px-4 py-2">Field</th>
                      <th className="px-4 py-2">Validation Error Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importSummary.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-red-50/30">
                        <td className="px-4 py-2 font-mono font-bold text-slate-600">{err.rowNumber}</td>
                        <td className="px-4 py-2 font-mono text-blue-900 font-bold">{err.memberId}</td>
                        <td className="px-4 py-2 font-semibold text-slate-700">{err.fieldName}</td>
                        <td className="px-4 py-2 text-red-700">{err.errorMessage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IMPORT HISTORY LOG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-900" />
            <h3 className="font-bold text-sm text-slate-900">Import Batch History</h3>
          </div>
          <button onClick={loadHistory} className="text-xs text-blue-700 hover:underline">
            Refresh
          </button>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No import batches recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">File Name</th>
                  <th className="px-4 py-2.5">Total Rows</th>
                  <th className="px-4 py-2.5">Imported</th>
                  <th className="px-4 py-2.5">Failed</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Operator</th>
                  <th className="px-4 py-2.5 text-right">Error Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.fileName}</span>
                    </td>
                    <td className="px-4 py-3 font-bold">{b.totalRows}</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold">{b.importedRows}</td>
                    <td className="px-4 py-3 text-red-600 font-bold">{b.failedRows}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.importedBy}</td>
                    <td className="px-4 py-3 text-right">
                      {b.failedRows > 0 ? (
                        <button
                          onClick={() => handleDownloadErrors(b.id)}
                          className="p-1 rounded text-red-600 hover:bg-red-50 transition"
                          title="Download Error Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

