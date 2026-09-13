import React, { useState, useEffect, type ReactNode, useCallback } from 'react';
import {
  QueryContext,
  type StoredQuery,
  type AttachedFile,
  type FileModalityCategory,
  type GeoContext,
  type ChatMessage,
  type Conversation,
} from './queryContextDef';
import { analyzeQuery, fetchImageAsObjectUrl, ApiError, type UploadGroup } from '../utils/api';

const STORAGE_KEY = 'satquery_recent_queries';
const MAX_RECENT_QUERIES = 10;

const defaultGeoContext: GeoContext = {
  regionName: 'Global / Auto-Detect',
  country: 'Worldwide',
  sensor: 'auto',
  language: 'en-US',
};

// The backend's /api/v1/analyze endpoint only accepts these four upload
// groups (see backend/app/routers/analyze.py); 'document'/'other' files
// have no server-side handling yet and are excluded client-side instead of
// being silently dropped by the request.
const CATEGORY_TO_UPLOAD_GROUP: Partial<Record<FileModalityCategory, UploadGroup>> = {
  optical_t1: 'optical_t1_files',
  optical_t2: 'optical_t2_files',
  sar_t1: 'sar_t1_files',
  sar_t2: 'sar_t2_files',
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recentQueries, setRecentQueries] = useState<StoredQuery[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Failed to load recent queries from localStorage:', err);
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string | null>(null);
  const [showPlaceholderResponse, setShowPlaceholderResponse] = useState(false);

  // ── Chat state ──
  const [chatMode, setChatMode] = useState(false);
  /** All conversations keyed by their ID */
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  /** Which conversation is currently displayed */
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Derived: messages of the active conversation
  const chatMessages: ChatMessage[] =
    activeConversationId ? (conversations[activeConversationId]?.messages ?? []) : [];

  // ── File Attachments ──
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ── Geographic Context ──
  const [geoContext, setGeoContext] = useState<GeoContext>(defaultGeoContext);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);

  // ── Voice ──
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Sync recentQueries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentQueries));
    } catch (err) {
      console.error('Failed to save recent queries to localStorage:', err);
    }
  }, [recentQueries]);

  // ── File helpers ─────────────────────────────────────────────────────────────
  const inferCategory = (filename: string): FileModalityCategory => {
    const lower = filename.toLowerCase();
    if (lower.includes('sar') && (lower.includes('t2') || lower.includes('post'))) return 'sar_t2';
    if (lower.includes('sar')) return 'sar_t1';
    if (lower.includes('t2') || lower.includes('post') || lower.includes('2024')) return 'optical_t2';
    if (lower.endsWith('.tif') || lower.endsWith('.tiff') || lower.includes('b0') || lower.includes('b1') || lower.includes('t1')) return 'optical_t1';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'optical_t1';
    return 'document';
  };

  const addAttachedFiles = useCallback((files: FileList | File[], explicitCategory?: FileModalityCategory) => {
    const fileArray = Array.from(files);
    const newItems: AttachedFile[] = fileArray.map((file) => {
      const category = explicitCategory || inferCategory(file.name);
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.tif') && !file.name.toLowerCase().endsWith('.tiff')) {
        try { previewUrl = URL.createObjectURL(file); } catch { /* ignore */ }
      }
      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file, name: file.name, size: file.size,
        type: file.type || 'application/octet-stream',
        category, previewUrl,
      };
    });
    setAttachedFiles((prev) => [...prev, ...newItems]);
  }, []);

  const removeAttachedFile = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) { try { URL.revokeObjectURL(target.previewUrl); } catch { /* ignore */ } }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAttachedFiles = useCallback(() => {
    setAttachedFiles((prev) => {
      prev.forEach((f) => { if (f.previewUrl) { try { URL.revokeObjectURL(f.previewUrl); } catch { /* ignore */ } } });
      return [];
    });
  }, []);

  const updateFileCategory = useCallback((id: string, category: FileModalityCategory) => {
    setAttachedFiles((prev) => prev.map((item) => (item.id === id ? { ...item, category } : item)));
  }, []);

  // ── Helper: mutate one conversation's messages ────────────────────────────────
  const setConversationMessages = useCallback((convId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setConversations((prev) => {
      const conv = prev[convId];
      if (!conv) return prev;
      return { ...prev, [convId]: { ...conv, messages: updater(conv.messages) } };
    });
  }, []);

  // ── runAnalysis: POST /api/v1/analyze and resolve the loading bubble ────────
  const runAnalysis = useCallback(
    async (convId: string, loadingId: string, queryText: string, files: AttachedFile[]) => {
      const filesByGroup: Partial<Record<UploadGroup, File[]>> = {};
      const skippedFiles: string[] = [];
      files.forEach((f) => {
        const group = CATEGORY_TO_UPLOAD_GROUP[f.category];
        if (!group) {
          skippedFiles.push(f.name);
          return;
        }
        (filesByGroup[group] ??= []).push(f.file);
      });

      const finish = (patch: Partial<ChatMessage>) => {
        setConversationMessages(convId, (prev) =>
          prev.map((msg) => (msg.id === loadingId ? { ...msg, ...patch } : msg))
        );
      };

      const hasRequiredT1 =
        (filesByGroup.optical_t1_files?.length ?? 0) > 0 || (filesByGroup.sar_t1_files?.length ?? 0) > 0;

      if (!hasRequiredT1) {
        finish({
          text:
            'At least one optical or SAR image is required to run analysis. Attach imagery with the paperclip icon and try again.',
          meta: { isLoading: false, isError: true, model: 'SatQuery AI' },
        });
        return;
      }

      try {
        const result = await analyzeQuery(queryText, filesByGroup);

        let images: Record<string, string> | undefined;
        const imageEntries = Object.entries(result.image_urls);
        if (imageEntries.length > 0) {
          const resolved = await Promise.all(
            imageEntries.map(async ([name, url]) => [name, await fetchImageAsObjectUrl(url)] as const)
          );
          images = Object.fromEntries(resolved);
        }

        const warnings = [...result.execution_summary.warnings];
        if (skippedFiles.length > 0) {
          warnings.push(
            `Not sent to the model (unsupported category): ${skippedFiles.join(', ')}.`
          );
        }

        const confidencePct =
          result.confidence != null
            ? Math.round((result.confidence <= 1 ? result.confidence * 100 : result.confidence) * 10) / 10
            : undefined;

        const answerText =
          result.answer ??
          (result.change_percentage != null
            ? `Change detection complete: ${result.change_percentage.toFixed(1)}% of the scene changed between T1 and T2.`
            : 'Analysis complete.');

        finish({
          text: answerText,
          meta: {
            isLoading: false,
            model: result.execution_summary.models_used.join(' + ') || 'SatQuery AI',
            confidence: confidencePct,
            sensor: geoContext.sensor,
            region: geoContext.regionName,
            executionId: result.execution_id,
            task: result.task,
            changePercentage: result.change_percentage,
            regions: result.regions,
            groundedRegions: result.grounded_regions,
            images,
            reportUrl: result.report_url,
            warnings,
          },
        });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Unexpected error contacting the SatQuery backend.';
        finish({ text: message, meta: { isLoading: false, isError: true, model: 'SatQuery AI' } });
      }
    },
    [setConversationMessages, geoContext]
  );

  // ── handleQuerySubmit ────────────────────────────────────────────────────────
  //   • chatMode=true  → append to the CURRENT conversation (no new sidebar entry)
  //   • chatMode=false → start a NEW conversation + add to recent queries (no dedup)
  const handleQuerySubmit = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    const queryDisplay = trimmed || `Analyze uploaded imagery (${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''})`;
    const now = Date.now();
    const msgId = `${now}-${Math.random().toString(36).substring(2, 7)}`;
    const loadingId = `${msgId}-loading`;
    const filesSnapshot = attachedFiles;

    const userMessage: ChatMessage = {
      id: `${msgId}-user`,
      role: 'user',
      text: queryDisplay,
      timestamp: now,
      attachedFiles: attachedFiles.map((f) => ({ name: f.name, size: f.size, category: f.category })),
    };

    const loadingMessage: ChatMessage = {
      id: loadingId,
      role: 'assistant',
      text: '',
      timestamp: now + 1,
      meta: { isLoading: true, model: 'Routing…', sensor: geoContext.sensor, region: geoContext.regionName },
    };

    setSearchQuery('');
    setLastSubmittedQuery(queryDisplay);
    setShowPlaceholderResponse(false);

    // ── Branch A: already in a chat → CONTINUE the current conversation ─────
    if (chatMode && activeConversationId) {
      const targetId = activeConversationId;
      setConversations((prev) => {
        const conv = prev[targetId];
        if (!conv) return prev;
        return {
          ...prev,
          [targetId]: { ...conv, messages: [...conv.messages, userMessage, loadingMessage] },
        };
      });

      // Move this conversation to top of recent queries stack
      setRecentQueries((prev) => {
        const existingIndex = prev.findIndex((q) => q.id === targetId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          const [entry] = updated.splice(existingIndex, 1);
          updated.unshift({ ...entry, timestamp: now });
          return updated.slice(0, MAX_RECENT_QUERIES);
        }
        // Fallback: conversation exists but not in recent queries (shouldn't happen)
        const conv = conversations[targetId];
        if (conv) {
          return [{ id: targetId, text: conv.query, timestamp: now }, ...prev].slice(0, MAX_RECENT_QUERIES);
        }
        return prev;
      });

      void runAnalysis(targetId, loadingId, queryDisplay, filesSnapshot);
      return; // ← do NOT create a new recent-query entry
    }

    // ── Branch B: landing page → start a NEW conversation ───────────────────
    const convId = msgId;
    const newConversation: Conversation = {
      id: convId,
      query: queryDisplay,
      messages: [userMessage, loadingMessage],
      timestamp: now,
    };

    setConversations((prev) => ({ ...prev, [convId]: newConversation }));
    setActiveConversationId(convId);
    setChatMode(true);

    // Add to recent queries — NO dedup removal, always prepend
    const newEntry: StoredQuery = { id: convId, text: queryDisplay, timestamp: now };
    setRecentQueries((prev) => [newEntry, ...prev].slice(0, MAX_RECENT_QUERIES));

    void runAnalysis(convId, loadingId, queryDisplay, filesSnapshot);
  }, [attachedFiles, geoContext, chatMode, activeConversationId, conversations, runAnalysis]);

  /**
   * Load a PAST conversation from history — switches active conversation WITHOUT
   * re-running the query. This is what sidebar "Recent Queries" clicks should call.
   */
  const loadConversation = useCallback((id: string) => {
    if (!conversations[id]) {
      console.warn('[SatQuery] Conversation not found in memory:', id);
      return;
    }
    setActiveConversationId(id);
    setChatMode(true);
  }, [conversations]);

  const prefillQuery = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const clearRecentQueries = useCallback(() => {
    setRecentQueries([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) {
      console.error('Failed to clear recent queries from localStorage:', err);
    }
  }, []);

  const clearChat = useCallback(() => {
    setActiveConversationId(null);
    setChatMode(false);
    setLastSubmittedQuery(null);
    // Imagery is scoped to the session it was uploaded for — carrying it
    // into a brand-new session would silently resend stale files to /analyze.
    clearAttachedFiles();
  }, [clearAttachedFiles]);

  return (
    <QueryContext.Provider
      value={{
        recentQueries,
        searchQuery,
        setSearchQuery,
        lastSubmittedQuery,
        showPlaceholderResponse,
        setShowPlaceholderResponse,
        handleQuerySubmit,
        prefillQuery,
        clearRecentQueries,
        chatMode,
        setChatMode,
        chatMessages,
        clearChat,
        conversations,
        activeConversationId,
        loadConversation,
        attachedFiles,
        addAttachedFiles,
        removeAttachedFile,
        clearAttachedFiles,
        updateFileCategory,
        geoContext,
        setGeoContext,
        isGeoModalOpen,
        setIsGeoModalOpen,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isVoiceActive,
        setIsVoiceActive,
        voiceTranscript,
        setVoiceTranscript,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
};
