# SatQuery AI — Frontend

React 19 + TypeScript single-page app for SatQuery AI: a chat-style
interface for asking questions about satellite imagery, with a 3D Earth
hero, file-upload flows for optical/SAR T1/T2 scenes, and a saved-results
viewer backed by the API's execution reports.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19, React Router 7 |
| Language | TypeScript 6 |
| Build / dev server | Vite 8 |
| Styling | Tailwind CSS 3, PostCSS, `clsx` + `tailwind-merge` |
| 3D | Three.js (Earth globe, starfield) |
| Icons | lucide-react |
| Lint | oxlint |

## Layout

```
frontend/
├── public/
│   └── textures/           # Earth albedo/normal/specular/cloud/night maps
├── src/
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Router + providers
│   ├── pages/              # Route-level screens
│   │   ├── Home.tsx        #   /             hero + search + chat
│   │   ├── Explore.tsx     #   /explore
│   │   ├── MyData.tsx      #   /my-data
│   │   ├── SavedResults.tsx#   /saved-results  (GET /api/v1/reports)
│   │   ├── Alerts.tsx      #   /alerts
│   │   ├── Settings.tsx    #   /settings
│   │   └── About.tsx       #   /about
│   ├── components/         # Layout, TopNav, Sidebar, ChatView, SearchBar,
│   │                       # FileUploadModal, GeoContextModal, EarthVisual, ...
│   ├── context/            # QueryProvider — shared query / upload state
│   ├── hooks/              # useVoiceRecognition (Web Speech API)
│   ├── utils/
│   │   ├── api.ts          # Typed client for the backend API
│   │   ├── taskLabels.ts   # Task id → display label
│   │   └── timeAgo.ts
│   └── assets/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── .env.example
```

## Getting started

Requires **Node.js 22+**.

```bash
cd frontend
npm ci
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:5173
```

The backend must be running (default `http://127.0.0.1:8000`) and its
`CORS_ALLOW_ORIGINS` must include the dev origin. It does by default.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend base URL |
| `VITE_API_KEY` | — | Sent as `X-API-Key` when the backend requires auth |

> ⚠️ `VITE_*` variables are compiled into the client bundle and visible to
> anyone who loads the page. Only use `VITE_API_KEY` for local or trusted
> deployments.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

The root `package.json` proxies these scripts, so `npm run dev` also works
from the repository root.

## API integration

`src/utils/api.ts` is a thin typed client over the backend:

- `analyzeQuery()` builds the four-group multipart `FormData`
  (`optical_t1_files`, `optical_t2_files`, `sar_t1_files`, `sar_t2_files`).
- Result images are fetched as authenticated blobs and shown via object
  URLs, because a plain `<img src>` can't send the `X-API-Key` header.
- The UI requires at least one T1 image before sending anything, the same
  rule the backend enforces.
