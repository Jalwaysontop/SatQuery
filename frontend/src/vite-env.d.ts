/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the SatQuery FastAPI backend, e.g. http://127.0.0.1:8000 */
  readonly VITE_API_BASE_URL?: string;
  /** Shared-secret sent as the X-API-Key header. Omit in local dev when the backend has ALLOW_NO_AUTH_IN_DEV=true. */
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
