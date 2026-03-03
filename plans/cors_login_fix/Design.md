# CORS / Login Fix — Design

## Architecture Overview

```
┌──────────────────────────────────┐
│  Browser  (http://localhost:5173)│
│  Vite dev-server                 │
│                                  │
│  /api/** ──proxy──► backend:8090 │
│  /ws/**  ──proxy──► backend:8090 │
└──────────────────────────────────┘
           │ (same-origin)
           ▼
┌──────────────────────────────────┐
│  Spring Boot Backend             │
│  http://localhost:8090 (no SSL)  │
│                                  │
│  CorsConfig  ──► allows :5173    │
│  SecurityConfig ──► permits      │
│      /api/auth/**, /api/access/**│
└──────────────────────────────────┘
```

## Design Decisions

### D-1: Disable SSL for local development via `.env`

**File:** `backend/.env`

Add `SSL_ENABLED=false` so the `application.properties` placeholder `${SSL_ENABLED:true}` resolves to `false`.

This is the **minimal, single-line fix** that resolves the immediate CORS error.

### D-2: Add Vite reverse proxy (defense-in-depth)

**File:** `frontend/intelliquiz-frontend/vite.config.ts`

```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8090',
      changeOrigin: true,
    },
    '/ws': {
      target: 'http://localhost:8090',
      changeOrigin: true,
      ws: true,
    },
  },
},
```

With the proxy, the frontend can use relative URLs (`/api/auth/login`) during development, making CORS a non-issue (same-origin). The `CorsConfig` still protects production where there is no proxy.

### D-3: Make frontend API base URL configurable

**File:** `frontend/intelliquiz-frontend/src/services/api.ts`

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

- When `VITE_API_BASE_URL` is empty (or unset), requests go to the same origin → handled by the Vite proxy in dev.
- For production builds, set `VITE_API_BASE_URL` to the real backend URL.

**File:** `frontend/intelliquiz-frontend/.env`

```
VITE_API_BASE_URL=
```

### D-4: Fix Docker-compose backend environment

**File:** `docker-compose.yml`

Add to the backend service environment:

```yaml
SERVER_PORT: 8082
SSL_ENABLED: "false"
```

This aligns the Spring Boot port with the `EXPOSE 8080` / healthcheck on 8082 and disables HTTPS inside the container.

### D-5: Fix hardcoded URLs in other files

Update `BackupsPage.tsx` and `websocket.ts` to use the same configurable base URL pattern instead of hardcoded `http://localhost:8090`.

## Files Changed

| File | Change |
|------|--------|
| `backend/.env` | Add `SSL_ENABLED=false` |
| `frontend/intelliquiz-frontend/vite.config.ts` | Add `server.proxy` for `/api` and `/ws` |
| `frontend/intelliquiz-frontend/src/services/api.ts` | Use `import.meta.env.VITE_API_BASE_URL` |
| `frontend/intelliquiz-frontend/.env` | Create with `VITE_API_BASE_URL=` |
| `frontend/intelliquiz-frontend/src/pages/superadmin/BackupsPage.tsx` | Remove hardcoded URL |
| `frontend/intelliquiz-frontend/src/config/websocket.ts` | Remove hardcoded URL |
| `docker-compose.yml` | Add `SERVER_PORT` and `SSL_ENABLED` |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Disabling SSL in local dev exposes traffic on loopback | Acceptable — localhost only, no external exposure |
| Vite proxy masks CORS issues until production | `CorsConfig.java` already correctly configured; tested in Docker mode |
| Changing API_BASE_URL breaks existing calls | Default empty string keeps same-origin behavior; no functional change |
