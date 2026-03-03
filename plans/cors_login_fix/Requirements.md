# CORS / Login Fix — Requirements

## Problem Statement

Admin login from the frontend (`http://localhost:5173`) fails with:

```
Access to fetch at 'http://localhost:8090/api/auth/login' from origin 'http://localhost:5173'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause Analysis

| Layer | Current Value | Expected |
|-------|--------------|----------|
| `application.properties` → `server.ssl.enabled` | `${SSL_ENABLED:true}` (defaults to **true**) | `false` for local dev |
| `backend/.env` → `SSL_ENABLED` | **not set** → defaults to `true` | `false` |
| Backend listens on | **HTTPS** `:8090` | **HTTP** `:8090` |
| Frontend calls | `http://localhost:8090` (plain HTTP) | Must match backend protocol |

The browser sends a preflight `OPTIONS` request over **HTTP** to a server that only speaks **HTTPS**.
The TLS handshake fails silently; the browser receives no response headers at all and reports it as a CORS violation.

## Requirements

### REQ-1: Local development must work over plain HTTP
- The backend **must** start on `http://localhost:8090` (no SSL) when running locally.
- The `.env` file must explicitly set `SSL_ENABLED=false`.

### REQ-2: Frontend API base URL must use an environment variable
- Replace the hardcoded `http://localhost:8090` in `api.ts` with `import.meta.env.VITE_API_BASE_URL`.
- Provide a `.env` (or `.env.local`) in the frontend with the default `VITE_API_BASE_URL=http://localhost:8090`.
- This makes switching between local dev, Docker, and production painless.

### REQ-3: Vite dev-server proxy for `/api` and `/ws`
- Add a `server.proxy` section in `vite.config.ts` so the browser talks same-origin and CORS is bypassed entirely during development.
- The proxy forwards `/api/**` and `/ws/**` to the backend.

### REQ-4: Docker configuration consistency
- Docker-compose does **not** set `SERVER_PORT` or `SSL_ENABLED`; the container internally defaults to port **8443 + HTTPS**, but the healthcheck is HTTP on **8082**. This mismatch must be fixed.
- Add `SERVER_PORT=8082` and `SSL_ENABLED=false` to the docker-compose backend environment.

### REQ-5: Existing CORS config remains valid
- `CorsConfig.java` already allows `http://localhost:5173`. No changes needed there.
- `SecurityConfig.java` correctly permits `/api/auth/**`. No changes needed.

### Non-Requirements
- No changes to JWT logic, authentication flow, or database.
- No changes to production SSL setup (that uses real certs).
