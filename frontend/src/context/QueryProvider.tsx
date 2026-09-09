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

const STORAGE_KEY = 'satquery_recent_queries';
const MAX_RECENT_QUERIES = 10;

const defaultGeoContext: GeoContext = {
  regionName: 'Global / Auto-Detect',
  country: 'Worldwide',
  sensor: 'auto',
  language: 'en-US',
};

// ─── Placeholder response routing ─────────────────────────────────────────────
function getPlaceholderResponse(query: string, sensor: string) {
  const q = query.toLowerCase();
  if (q.includes('flood') || q.includes('water') || q.includes('sar')) {
    return {
      text: 'SAR imagery analysis queued. The Sentinel-1 SAR specialist model would detect water body extents using backscatter intensity thresholding (VV/VH polarisation). Flood extent and affected zone mapping would be returned with a bounding polygon overlay.',
      model: 'Sentinel-1 SAR Flood Detector',
      confidence: 87,
    };
  }
  if (q.includes('change') || q.includes('before') || q.includes('after') || q.includes('between')) {
    return {
      text: 'Bi-temporal change detection queued. The change detection specialist would co-register the two images, compute per-pixel difference maps, and classify changed regions by type (urban growth, vegetation loss, water extent change). A confidence-scored change map would be returned.',
      model: 'Change Detection Model (Bi-temporal)',
      confidence: 91,
    };
  }
  if (q.includes('deforest') || q.includes('forest') || q.includes('vegetation') || q.includes('ndvi') || q.includes('crop')) {
    return {
      text: 'Vegetation analysis queued. The optical VQA model would compute NDVI, EVI, and SAVI indices from Sentinel-2 NIR/Red bands to classify vegetation health, detect stressed zones, and quantify canopy coverage changes.',
      model: 'Sentinel-2 Vegetation Analyst',
      confidence: 89,
    };
  }
  if (q.includes('land use') || q.includes('classify') || q.includes('class') || q.includes('urban')) {
    return {
      text: 'Land-use classification queued. The VQA specialist model would segment the scene into LULC classes (urban, agricultural, forest, water, barren) using multi-spectral band combinations. A pixel-wise classification map with class confidence scores would be returned.',
      model: 'LULC VQA Classifier',
      confidence: 84,
    };
  }
  if (sensor === 'fusion_optical_sar') {
    return {
      text: 'Optical + SAR cross-modal fusion queued. The fusion model would jointly embed both modalities to answer questions that neither sensor could fully resolve alone — combining spectral richness of optical data with the all-weather penetration of SAR.',
      model: 'Cross-Modal Fusion Model',
      confidence: 93,
    };
  }
  return {
    text: 'Query received. The agentic controller has dispatched this to the appropriate specialist model. Backend integration is pending — once connected, results will include detailed land-use classification, change detection statistics, or sensor fusion output here.',
    model: 'Agentic Router (Placeholder)',
    confidence: 0,
  };
}

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

    const placeholder = getPlaceholderResponse(queryDisplay, geoContext.sensor);
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

      setTimeout(() => {
        setConversations((prev) => {
          const conv = prev[targetId];
          if (!conv) return prev;
          return {
            ...prev,
            [targetId]: {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === loadingId
                  ? { ...msg, text: placeholder.text, meta: { isLoading: false, model: placeholder.model, confidence: placeholder.confidence, sensor: geoContext.sensor, region: geoContext.regionName } }
                  : msg
              ),
            },
          };
        });
      }, 1400);

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

    setTimeout(() => {
      setConversations((prev) => {
        const conv = prev[convId];
        if (!conv) return prev;
        return {
          ...prev,
          [convId]: {
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === loadingId
                ? { ...msg, text: placeholder.text, meta: { isLoading: false, model: placeholder.model, confidence: placeholder.confidence, sensor: geoContext.sensor, region: geoContext.regionName } }
                : msg
            ),
          },
        };
      });
    }, 1400);

    console.log('[SatQuery Engine] New conversation started:', { id: convId, query: queryDisplay, geoContext });
    // TODO: replace with POST /api/v1/analyze
  }, [attachedFiles, geoContext, chatMode, activeConversationId]);

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
  }, []);

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
