import React, { useCallback, useEffect, useState } from 'react';
import {
  Bookmark,
  Loader2,
  AlertTriangle,
  X,
  Clock,
  Cpu,
  Percent,
  ShieldCheck,
  ExternalLink,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import {
  listReports,
  getReport,
  fetchImageAsObjectUrl,
  ApiError,
  API_BASE_URL,
  type ExecutionListItem,
  type ExecutionReport,
} from '../utils/api';
import { taskLabel } from '../utils/taskLabels';
import { formatTimeAgo } from '../utils/timeAgo';

const statusColor = (status: string) =>
  status === 'success'
    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
    : 'text-red-300 bg-red-500/10 border-red-500/20';

export const SavedResults: React.FC = () => {
  const [items, setItems] = useState<ExecutionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [reportImages, setReportImages] = useState<Record<string, string>>({});
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listReports(50, 0);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reach the SatQuery backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openReport = useCallback(async (id: string) => {
    setSelectedId(id);
    setReport(null);
    setReportImages({});
    setReportError(null);
    setReportLoading(true);
    try {
      const full = await getReport(id);
      setReport(full);
      if (full.image_urls && Object.keys(full.image_urls).length > 0) {
        const resolved = await Promise.all(
          Object.entries(full.image_urls).map(
            async ([name, url]) => [name, await fetchImageAsObjectUrl(url)] as const
          )
        );
        setReportImages(Object.fromEntries(resolved));
      }
    } catch (err) {
      setReportError(err instanceof ApiError ? err.message : 'Failed to load this report.');
    } finally {
      setReportLoading(false);
    }
  }, []);

  const closeReport = () => {
    setSelectedId(null);
    setReport(null);
    setReportImages({});
    setReportError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12 z-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/10 flex-shrink-0">
            <Bookmark className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Saved Results</h1>
            <p className="text-xs text-gray-400">Audit trail of past executions, served from your reports history</p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-[#121826] border border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading reports…</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Could not load saved results</p>
            <p className="text-red-300/90 text-xs">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-slate-800/60 bg-[#0e1424]/60">
          <Inbox className="w-8 h-8 text-slate-500 mb-3" />
          <p className="text-sm text-slate-300 font-medium">No saved results yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Run a query with attached imagery from the Home page — every execution is recorded here automatically.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => void openReport(item.id)}
              className="w-full text-left p-3.5 rounded-xl bg-[#0f1728] border border-slate-800/80 hover:border-blue-500/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-100 group-hover:text-blue-300 truncate">{item.query}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                      {taskLabel(item.task)}
                    </span>
                    <span className={`text-[10px] font-mono border px-2 py-0.5 rounded-full ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Report Detail Modal ── */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0f1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121826] flex-shrink-0">
              <h3 className="text-sm font-bold text-white tracking-tight">Execution Report</h3>
              <button
                onClick={closeReport}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {reportLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading report…</span>
                </div>
              )}

              {!reportLoading && reportError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{reportError}</span>
                </div>
              )}

              {!reportLoading && report && (
                <>
                  <div>
                    <p className="text-xs text-slate-400 font-mono mb-1">Query</p>
                    <p className="text-sm text-slate-100">{report.query}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                      {taskLabel(report.task)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      <Cpu className="w-2.5 h-2.5" />
                      {report.models_used.join(' + ')}
                    </span>
                    {report.confidence != null && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {Math.round((report.confidence <= 1 ? report.confidence * 100 : report.confidence))}% confidence
                      </span>
                    )}
                    {report.change_percentage != null && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <Percent className="w-2.5 h-2.5" />
                        {report.change_percentage.toFixed(1)}% changed
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-full">
                      {report.duration_ms}ms
                    </span>
                  </div>

                  {report.answer && (
                    <div className="p-3.5 rounded-xl bg-[#0a0e1a] border border-slate-800/80 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {report.answer}
                    </div>
                  )}

                  {report.error_message && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{report.error_message}</span>
                    </div>
                  )}

                  {report.warnings.length > 0 && (
                    <div className="space-y-1">
                      {report.warnings.map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 rounded-lg px-2 py-1"
                        >
                          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {Object.keys(reportImages).length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 font-mono mb-2">Output imagery</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(reportImages).map(([name, url]) => (
                          <a
                            key={name}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-800 hover:border-blue-500/60 transition-colors"
                            title={name}
                          >
                            <img src={url} alt={name} className="w-full h-full object-cover" />
                            <span className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 text-[9px] font-mono text-white bg-black/70 truncate">
                              {name}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <a
                    href={`${API_BASE_URL}/api/v1/reports/${report.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Raw JSON report</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
