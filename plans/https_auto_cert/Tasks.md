# HTTPS Auto-Cert for Frontend Development — Tasks

## Pre-conditions
- [x] Backend runs on HTTPS (port 8090) with self-signed cert
- [x] Backend distributed as Docker container (teams cannot modify backend)
- [x] CookieService uses Secure + SameSite=Strict (requires HTTPS frontend)
- [x] CORS config allows `https://localhost:5173`

---

## Task 1: Create `generate-cert.cjs` (cross-platform cert script)
- **File:** `frontend/intelliquiz-frontend/generate-cert.cjs`
- **Details:**
  - Uses Node.js CommonJS (`.cjs`) to avoid ESM `require` error
  - Writes a temporary OpenSSL config to avoid `-addext` quoting issues on Windows
  - Detects OS to select correct shell (`cmd.exe` on Windows, `/bin/sh` on Unix)
  - Skips generation if `certs/localhost-key.pem` and `certs/localhost-cert.pem` exist
  - Prints helpful error with Windows-specific install tip if OpenSSL is missing
- **Status:** [x] Done

## Task 2: Update `package.json` dev script
- **File:** `frontend/intelliquiz-frontend/package.json`
- **Change:** `"dev": "node ./generate-cert.cjs && vite"`
- **Effect:** Cert auto-generated before Vite starts; fails fast if openssl missing
- **Status:** [x] Done

## Task 3: Configure Vite for HTTPS
- **File:** `frontend/intelliquiz-frontend/vite.config.ts`
- **Details:**
  - `import fs from 'fs'` at top
  - `server.https` reads `certs/localhost-key.pem` and `certs/localhost-cert.pem`
  - Proxy targets changed to `https://localhost:8090` with `secure: false`
- **Status:** [x] Done

## Task 4: Set frontend `.env` to HTTPS backend
- **File:** `frontend/intelliquiz-frontend/.env`
- **Change:** `VITE_API_BASE_URL=https://localhost:8090`
- **Status:** [x] Done

## Task 5: Add `certs/` to `.gitignore`
- **File:** `frontend/intelliquiz-frontend/.gitignore`
- **Change:** Append `certs/` entry
- **Status:** [x] Done

## Task 6: Add `https://localhost:*` origins to CORS config
- **File:** `backend/.../CorsConfig.java`
- **Change:** Added `https://localhost:5173`, `:5174`, `:5175`, `:3000` to allowed origins
- **Status:** [x] Done

## Task 7: Verify `npm run dev` works end-to-end
- **Action:** Run `npm run dev` — should generate certs (or skip), then start Vite on HTTPS
- **Verification:** Frontend accessible at `https://localhost:5173`, login works
- **Status:** [ ] Pending

---

## Teammate Onboarding Checklist

When a teammate clones the repo and wants to run the frontend:

1. **Install Node.js** (v18+)
2. **Install Git for Windows** (bundles OpenSSL)
3. **Ensure OpenSSL is in PATH:**
   - Open terminal, run `openssl version`
   - If not found, add `C:\Program Files\Git\usr\bin` to system PATH
4. **Run:**
   ```sh
   cd frontend/intelliquiz-frontend
   npm install
   npm run dev
   ```
5. **Accept self-signed cert in browser:**
   - Open `https://localhost:5173`
   - Click "Advanced" → "Proceed to localhost (unsafe)"
   - Also accept `https://localhost:8090` (backend) in a separate tab

That's it. No manual `openssl` commands, no `chmod`, no shell scripts.
