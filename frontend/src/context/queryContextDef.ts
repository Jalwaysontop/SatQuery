import { createContext } from 'react';

export interface StoredQuery {
  id: string;
  text: string;
  timestamp: number;
}

export type FileModalityCategory =
  | 'optical_t1'
  | 'optical_t2'
  | 'sar_t1'
  | 'sar_t2'
  | 'document'
  | 'other';

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: FileModalityCategory;
  previewUrl?: string;
}

export interface GeoContext {
  regionName: string;
  country?: string;
  bbox?: [number, number, number, number] | null;
  coordinates?: { lat: number; lon: number };
  sensor: 'auto' | 'sentinel2_optical' | 'sentinel1_sar' | 'fusion_optical_sar' | 'landsat9';
  language: string;
}

// ─── Chat Types ──────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
  /** Files attached by the user (only on role='user' messages) */
  attachedFiles?: { name: string; size: number; category: FileModalityCategory }[];
  /** Metadata surfaced on assistant messages */
  meta?: {
    model?: string;
    confidence?: number;       // 0–100
    sensor?: string;
    region?: string;
    isLoading?: boolean;
  };
}

/** A complete conversation keyed by its ID (same as the StoredQuery ID) */
export interface Conversation {
  id: string;
  query: string;        // the original question text
  messages: ChatMessage[];
  timestamp: number;
}

// ─── Context Shape ────────────────────────────────────────────────────────────

export interface QueryContextType {
  recentQueries: StoredQuery[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lastSubmittedQuery: string | null;
  showPlaceholderResponse: boolean;
  setShowPlaceholderResponse: (show: boolean) => void;
  handleQuerySubmit: (text: string) => void;
  prefillQuery: (text: string) => void;
  clearRecentQueries: () => void;

  // Chat mode
  chatMode: boolean;
  setChatMode: (on: boolean) => void;
  chatMessages: ChatMessage[];      // messages of the ACTIVE conversation
  clearChat: () => void;

  // Conversation history (each query gets its own isolated thread)
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  /** Load a past conversation by ID — does NOT re-run the query */
  loadConversation: (id: string) => void;

  // File attachments
  attachedFiles: AttachedFile[];
  addAttachedFiles: (files: FileList | File[], category?: FileModalityCategory) => void;
  removeAttachedFile: (id: string) => void;
  clearAttachedFiles: () => void;
  updateFileCategory: (id: string, category: FileModalityCategory) => void;

  // Geographic context (Globe feature)
  geoContext: GeoContext;
  setGeoContext: (ctx: GeoContext) => void;
  isGeoModalOpen: boolean;
  setIsGeoModalOpen: (open: boolean) => void;

  // File upload modal
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;

  // Voice recording / transcription
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (transcript: string) => void;
}

export const QueryContext = createContext<QueryContextType | undefined>(undefined);
