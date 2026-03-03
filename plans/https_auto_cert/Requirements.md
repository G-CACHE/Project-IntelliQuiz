# HTTPS Auto-Cert for Frontend Development — Requirements

## Context

The backend is distributed to other teams as a **Docker container** (pre-built image).
Teams cannot modify backend code, CORS config, or SSL settings.
The backend runs on **HTTPS (port 8090)** with a self-signed certificate and sets
**HttpOnly, Secure, SameSite=Strict** cookies for JWT authentication.

For authentication cookies to work, the frontend **must also run on HTTPS**.

## Problem Statement

Teammates (on **Windows**) must run the frontend on HTTPS to match the backend.
Generating SSL certificates manually is tedious, error-prone, and easy to forget.
The goal is: **run `npm run dev` and everything works — no extra steps.**

## Requirements

### REQ-1: Zero-manual-step HTTPS for `npm run dev`
- Running `npm run dev` must automatically:
  1. Generate a self-signed TLS certificate if one does not already exist.
  2. Start the Vite dev server on HTTPS using that certificate.
- No manual commands (e.g., `chmod`, `openssl`, shell scripts) should be required.

### REQ-2: Cross-platform (Windows-first)
- Must work on **Windows** (primary target), macOS, and Linux.
- Must not rely on Unix-only features (`chmod`, `.sh` scripts, `__dirname` in ESM, etc.).
- OpenSSL is the only external dependency; it is bundled with Git for Windows.

### REQ-3: Certs must not be committed to version control
- The `certs/` directory must be in `.gitignore`.
- Each developer generates their own certificate locally.

### REQ-4: Skip generation if certs already exist
- If `certs/localhost-key.pem` and `certs/localhost-cert.pem` already exist, skip generation.
- This avoids unnecessary work on every `npm run dev` invocation.

### REQ-5: Vite dev proxy must forward to HTTPS backend
- The Vite proxy for `/api` and `/ws` must target `https://localhost:8090`.
- `secure: false` must be set to accept the backend's self-signed certificate.

### REQ-6: CORS origins must include HTTPS frontend
- The backend's CORS config must allow `https://localhost:5173` as an origin.
- (Already done — this is a validation requirement, not a new change.)

### REQ-7: Clear error messages on failure
- If OpenSSL is not found, the script must print a helpful message explaining how to install it.
- On Windows, it should suggest installing Git for Windows and adding its `usr/bin` to PATH.

## Non-Requirements
- No changes to the backend Docker image.
- No CI/CD pipeline changes (certs are dev-only).
- No real CA-signed certificates (self-signed is acceptable for local development).
