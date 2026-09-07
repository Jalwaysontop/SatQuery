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
  bbox?: [number, number, number, number] | null; // [minLon, minLat, maxLon, maxLat]
  coordinates?: { lat: number; lon: number };
  sensor: 'auto' | 'sentinel2_optical' | 'sentinel1_sar' | 'fusion_optical_sar' | 'landsat9';
  language: string;
}

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
