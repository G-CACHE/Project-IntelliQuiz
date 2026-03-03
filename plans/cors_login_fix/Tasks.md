# CORS / Login Fix — Tasks

## Pre-conditions
- [x] Root cause identified: SSL enabled by default, frontend uses plain HTTP
- [x] Requirements documented
- [x] Design documented

---

## Task 1: Disable SSL in backend `.env` (critical fix)
- **File:** `backend/.env`
- **Action:** Add `SSL_ENABLED=false`
- **Verification:** Backend starts on `http://localhost:8090` instead of HTTPS
- **Status:** [ ]

## Task 2: Add Vite dev proxy for `/api` and `/ws`
- **File:** `frontend/intelliquiz-frontend/vite.config.ts`
- **Action:** Add `server.proxy` configuration targeting `http://localhost:8090`
- **Verification:** Frontend fetches `/api/auth/login` through the proxy without CORS errors
- **Status:** [ ]

## Task 3: Make API base URL configurable in frontend
- **File:** `frontend/intelliquiz-frontend/src/services/api.ts`
- **Action:** Replace hardcoded `http://localhost:8090` with `import.meta.env.VITE_API_BASE_URL || ''`
- **Verification:** Login request uses relative URL in dev, absolute URL when env var is set
- **Status:** [ ]

## Task 4: Create frontend `.env` with default
- **File:** `frontend/intelliquiz-frontend/.env`
- **Action:** Create file with `VITE_API_BASE_URL=`
- **Status:** [ ]

## Task 5: Fix hardcoded URL in BackupsPage.tsx
- **File:** `frontend/intelliquiz-frontend/src/pages/superadmin/BackupsPage.tsx`
- **Action:** Replace `http://localhost:8090` with the configurable base URL
- **Status:** [ ]

## Task 6: Fix hardcoded URL in websocket.ts
- **File:** `frontend/intelliquiz-frontend/src/config/websocket.ts`
- **Action:** Replace `http://localhost:8090/ws/quiz` with configurable base URL
- **Status:** [ ]

## Task 7: Fix Docker-compose backend environment
- **File:** `docker-compose.yml`
- **Action:** Add `SERVER_PORT: 8082` and `SSL_ENABLED: "false"` to backend environment
- **Status:** [ ]

## Task 8: Restart backend and verify login
- **Action:** Restart the Spring Boot backend, attempt admin login from frontend
- **Verification:** No CORS error; login succeeds; token received
- **Status:** [ ]

---

## Execution Order
1. Task 1 (immediate fix — unblocks login)
2. Tasks 2–6 (frontend improvements — parallel)
3. Task 7 (Docker alignment)
4. Task 8 (verification)
