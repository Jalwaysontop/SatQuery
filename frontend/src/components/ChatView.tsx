import React, { useEffect, useRef } from 'react';
import {
  Satellite,
  FileImage,
  Radio,
  FileText,
  ShieldCheck,
  Cpu,
  RotateCcw,
  Loader2,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Percent,
  ScanSearch,
} from 'lucide-react';
import { useQueryContext } from '../context/useQueryContext';
import { type ChatMessage, type FileModalityCategory } from '../context/queryContextDef';
import { API_BASE_URL } from '../utils/api';
import { taskLabel } from '../utils/taskLabels';
import { SearchBar } from './SearchBar';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fileCategoryIcon(cat: FileModalityCategory) {
  if (cat.startsWith('sar')) return <Radio className="w-3 h-3 text-purple-400" />;
  if (cat === 'document') return <FileText className="w-3 h-3 text-slate-400" />;
  return <FileImage className="w-3 h-3 text-blue-400" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function sensorLabel(sensor: string) {
  const map: Record<string, string> = {
    auto: 'Auto',
    sentinel2_optical: 'S2 Optical',
    sentinel1_sar: 'S1 SAR',
    fusion_optical_sar: 'Optical+SAR',
    landsat9: 'Landsat 9',
  };
  return map[sensor] ?? sensor;
}

// ─── User Message Bubble ────────────────────────────────────────────────────

const UserBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => (
  <div className="flex justify-end gap-3 group animate-fade-in">
    <div className="max-w-[72%] flex flex-col items-end gap-1.5">
      {/* Attached files chips */}
      {msg.attachedFiles && msg.attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-end">
          {msg.attachedFiles.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300"
            >
              {fileCategoryIcon(f.category)}
              <span className="max-w-[100px] truncate font-medium">{f.name}</span>
              <span className="text-slate-500 font-mono">{formatBytes(f.size)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message bubble */}
      <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-sm leading-relaxed shadow-lg shadow-blue-600/20">
        {msg.text}
      </div>
      <span className="text-[10px] text-slate-500 font-mono pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTime(msg.timestamp)}
      </span>
    </div>

    {/* Avatar */}
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-blue-500/30 mt-1">
      S
    </div>
  </div>
);

// ─── Assistant Message Bubble ───────────────────────────────────────────────

const AssistantBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isLoading = msg.meta?.isLoading;
  const isError = msg.meta?.isError;
  const confidence = msg.meta?.confidence;
  const images = msg.meta?.images;
  const regionCount = (msg.meta?.regions?.length ?? 0) + (msg.meta?.groundedRegions?.length ?? 0);

  return (
    <div className="flex gap-3 group animate-fade-in">
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ring-2 mt-1 ${
          isError
            ? 'bg-gradient-to-br from-red-500 to-rose-700 ring-red-500/20'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-blue-500/20'
        }`}
      >
        <Satellite className="w-4 h-4 text-white" />
      </div>

      <div className="max-w-[78%] flex flex-col gap-2">
        {/* Model + meta header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
            <Cpu className="w-2.5 h-2.5" />
            {msg.meta?.model ?? 'SatQuery AI'}
          </span>
          {msg.meta?.task && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              <ScanSearch className="w-2.5 h-2.5" />
              {taskLabel(msg.meta.task)}
            </span>
          )}
          {msg.meta?.region && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-full">
              <MapPin className="w-2.5 h-2.5 text-blue-400" />
              {msg.meta.region}
            </span>
          )}
          {msg.meta?.sensor && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-full">
              {sensorLabel(msg.meta.sensor)}
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-3.5 rounded-2xl rounded-tl-sm border text-sm leading-relaxed shadow-lg ${
            isError
              ? 'bg-red-950/30 border-red-500/30 text-red-200'
              : 'bg-[#0f1728] border-slate-800/80 text-slate-200'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-sm">Running specialist model…</span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              {isError && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
              <span className="whitespace-pre-wrap">{msg.text}</span>
            </div>
          )}
        </div>

        {/* Result imagery (overlay / confidence maps returned by the backend) */}
        {!isLoading && images && Object.keys(images).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(images).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group/img relative w-24 h-24 rounded-lg overflow-hidden border border-slate-800 hover:border-blue-500/60 transition-colors"
                title={name}
              >
                <img src={url} alt={name} className="w-full h-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 text-[9px] font-mono text-white bg-black/70 truncate">
                  {name}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Change % / region-count chips */}
        {!isLoading && (msg.meta?.changePercentage != null || regionCount > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {msg.meta?.changePercentage != null && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <Percent className="w-2.5 h-2.5" />
                {msg.meta.changePercentage.toFixed(1)}% changed
              </span>
            )}
            {regionCount > 0 && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-full">
                {regionCount} region{regionCount > 1 ? 's' : ''} detected
              </span>
            )}
          </div>
        )}

        {/* Warnings surfaced by the backend execution */}
        {!isLoading && msg.meta?.warnings && msg.meta.warnings.length > 0 && (
          <div className="space-y-1">
            {msg.meta.warnings.map((w, i) => (
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

        {/* Confidence bar (only when answer is ready and confidence is known) */}
        {!isLoading && !isError && confidence != null && (
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Confidence</span>
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 flex-shrink-0">
              {confidence}%
            </span>
          </div>
        )}

        {/* Footer: report link + timestamp */}
        {!isLoading && (
          <div className="flex items-center justify-between gap-3 pl-1">
            {msg.meta?.reportUrl ? (
              <a
                href={`${API_BASE_URL}${msg.meta.reportUrl}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                <span>Full report</span>
              </a>
            ) : <span />}
            <span className="text-[10px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ChatView ────────────────────────────────────────────────────────────────

export const ChatView: React.FC = () => {
  const { chatMessages, clearChat, conversations, activeConversationId } = useQueryContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="flex flex-col h-full w-full max-w-[860px] mx-auto px-4 relative">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between py-3 border-b border-slate-800/60 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-[12px] font-medium text-slate-300 truncate max-w-[500px]">
            {activeConversation ? activeConversation.query : 'Analysis Session'}
          </span>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer flex-shrink-0 ml-4"
          title="New session"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Session</span>
        </button>
      </div>

      {/* ── Message List ── */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
        {chatMessages.map((msg) =>
          msg.role === 'user'
            ? <UserBubble key={msg.id} msg={msg} />
            : <AssistantBubble key={msg.id} msg={msg} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Pinned Input ── */}
      <div className="flex-shrink-0 py-3 border-t border-slate-800/60">
        <SearchBar compact />
      </div>
    </div>
  );
};
