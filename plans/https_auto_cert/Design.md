# HTTPS Auto-Cert for Frontend Development — Design

## Architecture

```
 Developer runs: npm run dev
        │
        ▼
 ┌─────────────────────────────┐
 │  generate-cert.cjs (Node)   │
 │                              │
 │  if certs/ missing:          │
 │    1. Write temp openssl.cnf │
 │    2. exec openssl req -x509 │
 │    3. Output certs/*.pem     │
 │    4. Cleanup temp cnf       │
 │  else:                       │
 │    skip — certs exist        │
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │  Vite dev server (HTTPS)    │
 │  https://localhost:5173     │
 │                              │
 │  server.https:               │
 │    key: certs/localhost-key  │
 │    cert: certs/localhost-cert│
 │                              │
 │  server.proxy:               │
 │    /api → https://backend    │
 │    /ws  → wss://backend      │
 │    secure: false (self-sign) │
 └─────────────────────────────┘
```

## Design Decisions

### D-1: Use `.cjs` extension for the cert script

**Why:** The project has `"type": "module"` in `package.json`, which makes `.js` files ESM.
Using `require()` in ESM causes `ReferenceError: require is not defined`.
Renaming to `.cjs` forces Node to treat the file as CommonJS — no import rewriting needed.

### D-2: Use a temporary OpenSSL config file instead of `-addext` flag

**Why:** The `-addext` flag has quoting issues across shells, especially on Windows `cmd.exe`.
Writing a temporary `_openssl.cnf` file with the SAN extension is reliable on all platforms.
The file is auto-deleted after generation.

```
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
CN = localhost

[v3_req]
subjectAltName = DNS:localhost,IP:127.0.0.1
```

### D-3: Shell selection based on OS

**Why:** On Windows, `execSync` defaults to `cmd.exe` which may not find `openssl`.
We explicitly set `shell: 'cmd.exe'` on Windows and `'/bin/sh'` on Unix.
Git for Windows places OpenSSL in `C:\Program Files\Git\usr\bin` — users must add this to PATH.

### D-4: npm script chaining with `&&`

```json
"dev": "node ./generate-cert.cjs && vite"
```

**Why:** Simple, cross-platform (npm runs scripts via `cmd.exe` on Windows, `sh` on Unix).
If cert generation fails, `vite` does not start (fail-fast).

### D-5: Vite reads certs at startup via `fs.readFileSync`

```ts
server: {
  https: {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost-cert.pem'),
  },
}
```

The certs are guaranteed to exist because `generate-cert.cjs` runs first.

## Files

| File | Purpose |
|------|---------|
| `generate-cert.cjs` | Cross-platform Node script to generate self-signed certs |
| `certs/localhost-key.pem` | Private key (gitignored) |
| `certs/localhost-cert.pem` | Self-signed certificate (gitignored) |
| `vite.config.ts` | Reads certs, enables HTTPS, configures proxy |
| `package.json` | `dev` script chains cert generation → vite |
| `.gitignore` | Excludes `certs/` from version control |
| `.env` | Sets `VITE_API_BASE_URL=https://localhost:8090` |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| OpenSSL not in PATH | Script prints helpful install instructions, exits with code 1 |
| Certs already exist | Script prints "already exists", skips to Vite |
| Cert generation fails | Vite does not start (fail-fast via `&&`) |
| Browser warns about self-signed cert | User clicks "Advanced → Proceed" once per browser session |
