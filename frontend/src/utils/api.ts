/**
 * Typed client for the SatQuery FastAPI backend (backend/app/routers/*.py).
 * Mirrors backend/app/schemas.py response shapes exactly.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_API_KEY;

export type TaskType =
  | 'single_image_vqa'
  | 'single_image_captioning'
  | 'change_vqa'
  | 'cross_modal_fusion'
  | 'text_guided_grounding';

export interface ChangedRegion {
  region_id: number;
  bbox_px: number[];
  area_m2: number;
  mean_confidence: number;
  centroid_px: number[];
}

export interface GroundedRegion {
  region_id: number;
  bbox_px: number[];
  centroid_px: number[];
}

export interface ExecutionSummary {
  task: TaskType;
  models_used: string[];
  parameters: Record<string, unknown>;
  input_summary: Record<string, unknown>;
  duration_ms: number;
  warnings: string[];
}

export interface AnalyzeResponse {
  execution_id: string;
  task: TaskType;
  answer: string | null;
  confidence: number | null;
  change_percentage: number | null;
  regions: ChangedRegion[] | null;
  grounded_regions: GroundedRegion[] | null;
  image_urls: Record<string, string>;
  execution_summary: ExecutionSummary;
  report_url: string;
}

export interface ToolDescriptor {
  name: string;
  task: TaskType;
  description: string;
  requires: string[];
  domain_adapted: boolean;
  status: string;
}

export interface CapabilitiesResponse {
  tools: ToolDescriptor[];
}

export interface ExecutionListItem {
  id: string;
  created_at: string;
  task: TaskType;
  status: string;
  query: string;
}

export interface ExecutionListResponse {
  items: ExecutionListItem[];
  limit: number;
  offset: number;
}

/**
 * Shape of GET /api/v1/reports/{id} — the flattened DB record (see
 * backend/app/db.py + routers/reports.py), NOT the nested AnalyzeResponse
 * shape POST /analyze returns. `regions` is untyped JSON here: the DB
 * stores whichever region dicts the tool produced (ChangedRegion or
 * GroundedRegion shape) without re-validating them per-task on read.
 */
export interface ExecutionReport {
  id: string;
  created_at: string;
  query: string;
  task: TaskType;
  models_used: string[];
  parameters: Record<string, unknown>;
  status: string;
  answer: string | null;
  change_percentage: number | null;
  regions: Record<string, unknown>[] | null;
  confidence: number | null;
  warnings: string[];
  error_message: string | null;
  duration_ms: number;
  image_urls: Record<string, string>;
}

/** Backend field names that carry the four accepted upload groups. */
export type UploadGroup = 'optical_t1_files' | 'optical_t2_files' | 'sar_t1_files' | 'sar_t2_files';

export class ApiError extends Error {
  status: number;
  details: Record<string, unknown>;
  requestId: string | null;

  constructor(status: number, message: string, details: Record<string, unknown> = {}, requestId: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

function authHeaders(): HeadersInit {
  return API_KEY ? { 'X-API-Key': API_KEY } : {};
}

async function parseErrorBody(res: Response): Promise<{ message: string; details: Record<string, unknown>; requestId: string | null }> {
  try {
    const body = await res.json();
    if (body && typeof body.message === 'string') {
      return { message: body.message, details: body.details ?? {}, requestId: body.request_id ?? null };
    }
    if (body && Array.isArray(body.detail)) {
      // FastAPI's default 422 validation-error shape.
      const message = body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ') || 'Request validation failed.';
      return { message, details: {}, requestId: null };
    }
  } catch {
    /* fall through to generic message below */
  }
  return { message: `Request failed with status ${res.status}.`, details: {}, requestId: null };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, `Could not reach the SatQuery backend at ${API_BASE_URL}. Is it running?`);
  }

  if (!res.ok) {
    const { message, details, requestId } = await parseErrorBody(res);
    throw new ApiError(res.status, message, details, requestId);
  }

  return res.json() as Promise<T>;
}

/** POST /api/v1/analyze — the single agentic entry point. */
export async function analyzeQuery(
  query: string,
  filesByGroup: Partial<Record<UploadGroup, File[]>>
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('query', query);
  (Object.entries(filesByGroup) as [UploadGroup, File[] | undefined][]).forEach(([group, files]) => {
    (files ?? []).forEach((file) => formData.append(group, file, file.name));
  });

  return request<AnalyzeResponse>('/api/v1/analyze', { method: 'POST', body: formData });
}

/** GET /api/v1/tools — the predefined tool registry. */
export function getCapabilities(): Promise<CapabilitiesResponse> {
  return request<CapabilitiesResponse>('/api/v1/tools');
}

/** GET /api/v1/reports — paginated audit trail for the caller's API key. */
export function listReports(limit = 20, offset = 0): Promise<ExecutionListResponse> {
  return request<ExecutionListResponse>(`/api/v1/reports?limit=${limit}&offset=${offset}`);
}

/** GET /api/v1/reports/{id} — one full execution report. */
export function getReport(executionId: string): Promise<ExecutionReport> {
  return request<ExecutionReport>(`/api/v1/reports/${encodeURIComponent(executionId)}`);
}

/**
 * Fetches a report-relative image URL (e.g. AnalyzeResponse.image_urls values)
 * as an authenticated blob and returns an object URL the caller must revoke.
 * Plain <img src> can't attach the X-API-Key header, so this is required
 * whenever the backend is running with auth enabled.
 */
export async function fetchImageAsObjectUrl(relativeUrl: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}${relativeUrl}`, { headers: authHeaders() });
  if (!res.ok) {
    throw new ApiError(res.status, `Failed to load image ${relativeUrl}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>('/health');
}
