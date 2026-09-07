import React, { useState, useEffect, type ReactNode, useCallback } from 'react';
import {
  QueryContext,
  type StoredQuery,
  type AttachedFile,
  type FileModalityCategory,
  type GeoContext
} from './queryContextDef';

const STORAGE_KEY = 'satquery_recent_queries';
const MAX_RECENT_QUERIES = 10;

const defaultGeoContext: GeoContext = {
  regionName: 'Global / Auto-Detect',
  country: 'Worldwide',
  sensor: 'auto',
  language: 'en-US',
};

export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recentQueries, setRecentQueries] = useState<StoredQuery[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load recent queries from localStorage:', err);
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string | null>(null);
  const [showPlaceholderResponse, setShowPlaceholderResponse] = useState(false);

  // File Attachments
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Geographic Context (Globe)
  const [geoContext, setGeoContext] = useState<GeoContext>(defaultGeoContext);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);

  // Voice Interaction
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

  /**
   * Helper to infer modality category from filename if not explicitly chosen
   */
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
      let previewUrl: string | undefined = undefined;
      if (file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.tif') && !file.name.toLowerCase().endsWith('.tiff')) {
        try {
          previewUrl = URL.createObjectURL(file);
        } catch {
          // Ignore preview URL failures for non-blob objects
        }
      }
      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        category,
        previewUrl,
      };
    });

    setAttachedFiles((prev) => [...prev, ...newItems]);
  }, []);

  const removeAttachedFile = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // Ignore revoke error
        }
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAttachedFiles = useCallback(() => {
    setAttachedFiles((prev) => {
      prev.forEach((f) => {
        if (f.previewUrl) {
          try {
            URL.revokeObjectURL(f.previewUrl);
          } catch {
            // Ignore
          }
        }
      });
      return [];
    });
  }, []);

  const updateFileCategory = useCallback((id: string, category: FileModalityCategory) => {
    setAttachedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category } : item))
    );
  }, []);

  /**
   * Main query submission handler.
   * Logs query, stores in state + localStorage, resets input, and triggers placeholder feedback.
   */
  const handleQuerySubmit = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    const queryDisplay = trimmed || `Analyze uploaded imagery (${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''})`;

    // 1. Add query to Recent Queries (newest first, max 10)
    const newEntry: StoredQuery = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: queryDisplay,
      timestamp: Date.now(),
    };

    setRecentQueries((prev) => {
      const filtered = prev.filter((item) => item.text.toLowerCase() !== queryDisplay.toLowerCase());
      return [newEntry, ...filtered].slice(0, MAX_RECENT_QUERIES);
    });

    // 2. Set last submitted query and trigger placeholder UI response
    setLastSubmittedQuery(queryDisplay);
    setShowPlaceholderResponse(true);

    // 3. Clear search input
    setSearchQuery('');

    console.log('[SatQuery Engine] Query submitted:', {
      query: queryDisplay,
      attachedFiles: attachedFiles.map((f) => ({ name: f.name, size: f.size, category: f.category })),
      geoContext,
    });

    // TODO: replace with POST /api/v1/analyze (FastAPI backend integration)
    // Build multipart/form-data payload:
    // const formData = new FormData();
    // formData.append('query', queryDisplay);
    // attachedFiles.forEach(item => {
    //   if (item.category === 'optical_t1') formData.append('optical_t1_files', item.file);
    //   else if (item.category === 'optical_t2') formData.append('optical_t2_files', item.file);
    //   else if (item.category === 'sar_t1') formData.append('sar_t1_files', item.file);
    //   else if (item.category === 'sar_t2') formData.append('sar_t2_files', item.file);
    // });
    // const res = await fetch('http://127.0.0.1:8000/api/v1/analyze', { method: 'POST', body: formData });
    // const data = await res.json();
  }, [attachedFiles, geoContext]);

  /**
   * Prefills search bar without auto-submitting
   */
  const prefillQuery = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const clearRecentQueries = useCallback(() => {
    setRecentQueries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear recent queries from localStorage:', err);
    }
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
