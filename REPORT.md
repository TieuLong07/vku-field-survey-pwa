# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** Mini-Project 1 — VKU Field Survey PWA  
**Team / Student Name:** Nguyen Hoang Long  
**Submission Date:** 14/09/2026

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Nguyen Hoang Long — Student ID: 23IT.B119 — Role: Solo Developer (Frontend, Backend, Infrastructure) — Contribution: 100%
* **🔗 Live Demo URL:** https://vku-field-survey-78z.pages.dev
* **💻 GitHub Repository:** https://github.com/TieuLong07/vku-field-survey-pwa
* **🎥 Video Demo (Optional):** — (link submitted separately if applicable)

---

## 2. FEATURE IMPLEMENTATION CHECKLIST

| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | Responsive Mobile Viewport | ✅ Complete | Tailwind CSS responsive utilities, PWA mobile shell, sticky bottom tab bar on small screens, flexible card-based layout across 320px–1024px viewports. |
| 2 | Local Offline Persistence (IndexedDB via Dexie) | ✅ Complete | Dexie.js wrapper around IndexedDB (`VKUSurveyDB`). All survey records stored locally with auto-increment `id`, indexed on `status`, `building`, `equipment`, `condition`, `createdAt`. Zero network dependency for write operations. |
| 3 | Automatic Background Sync | ✅ Complete | `window.addEventListener('online')` listener triggers `syncUnsyncedSurveys()` on reconnection. Manual sync button available in Header. Records are batch-POSTed to Google Apps Script webhook; synced records deleted from local store after successful push. |
| 4 | Geolocation (GPS) | ✅ Complete | `Geolocation.getCurrentPosition({ enableHighAccuracy: true })`. Fallback to VKU campus coordinates (15.97526°N, 108.25317°E) with small jitter when GPS unavailable or permission denied. Accuracy reported in meters. |
| 5 | Image Capture & Compression | ✅ Complete | HTML5 Canvas client-side JPEG compression: max dimension 1200px, iterative quality reduction (0.8→0.2) until under 150KB. If still over target after quality reduction, canvas down-scaled to 70%. No server round-trip for compression. |
| 6 | Backend Sync — Google Sheets (Apps Script) | ✅ Complete | Google Apps Script Web App (`doPost`) bound to production Sheet via `SpreadsheetApp.openById()`. Accepts batch JSON payload, writes to `SurveyLogs` tab with auto-created header row and VKU-branded formatting. `LockService` prevents concurrent write corruption. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

```
vku-field-survey-pwa/
├── google-apps-script/
│   └── Code.gs                          # Apps Script backend (serverless webhook)
├── public/
│   ├── icons/                           # PWA icons (192, 512)
│   ├── apple-touch-icon.png
│   └── favicon.ico
├── src/
│   ├── App.tsx                          # Root component: tab routing, online/offline state,
│   │                                      triggerSync lifecycle, survey CRUD orchestration
│   ├── components/
│   │   ├── Header.tsx                   # Online/offline badge, sync button, pending counter, settings gear
│   │   ├── SurveyForm.tsx              # Form: building dropdown, room, equipment, condition, notes,
│   │   │                                  camera capture, GPS auto-fetch, image preview + size badge
│   │   ├── SurveyList.tsx              # Local records table, photo lightbox, delete & clear-synced actions
│   │   ├── SettingsModal.tsx           # Webhook URL editor (persisted to localStorage)
│   │   └── Toast.tsx                   # Transient notification system (success/error/warning/info)
│   ├── db/
│   │   └── database.ts                 # Dexie schema, helper functions: add, getUnsynced, markSynced,
│   │                                      delete, clearSynced
│   ├── services/
│   │   └── syncService.ts             # HTTP POST to Apps Script, batch payload builder,
│   │                                      syncUnsyncedSurveys(), DEFAULT_WEBHOOK_URL (production)
│   ├── types/
│   │   └── survey.ts                   # TypeScript interfaces: SurveyRecord, GPSLocation, SyncResult,
│   │                                      BuildingType, EquipmentType, ConditionType, SyncStatus
│   └── utils/
│       ├── geolocation.ts              # GPS wrapper with VKU fallback coordinates
│       └── imageCompressor.ts          # Canvas JPEG compression pipeline (iterative quality)
├── crypto-polyfill.cjs                  # Node crypto polyfill for Vite + workbox-build compat
├── vite.config.ts                       # React + PWA plugin, manifest, workbox config
├── tailwind.config.js                   # VKU blue (#0054A6) palette
└── dist/                                # Production build output (15 precached assets, ~400KB total)
```

### State Management Flow
```
Camera/GPS → SurveyForm → handleSurveySubmit()
  ├── addSurvey(record) → IndexedDB [status: 'pending']
  ├── if (online) → triggerSync() → syncUnsyncedSurveys()
  │     ├── fetch(Webhook_URL, POST JSON)
  │     ├── if success → db.surveys.bulkDelete(syncedIds)  ← records removed locally
  │     └── if error  → records retained, user can retry
  └── if (offline) → records stay pending, auto-sync fires on next 'online' event
```

### Exception Handling Strategies
* **GPS failure:** Falls back to VKU default coordinates + jitter for realistic demo data; error reported via Toast.
* **Image compression failure:** Rejects promise, displays error Toast, form remains editable.
* **Sync failure (network/error):** Caught in `syncService.ts` try/catch; records kept locally, user alerted via Toast with retry option.
* **Apps Script drive permission unavailable:** `Code.gs v2.1` wraps `DriveApp` calls in try/catch — if Drive scope missing, photo upload silently skipped (base64 text kept as fallback), but **Sheet row is always written**.

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

> *Replace the placeholders below with actual annotated screenshots from the live PWA or Chrome DevTools mobile emulation.*

**Screenshot 1 — Survey Form (Camera + GPS auto-fill)**
![Survey Form](screenshots/survey-form.png)

**Screenshot 2 — Sync Queue & History (pending/synced records)**
![Survey List](screenshots/survey-list.png)

**Screenshot 3 — Google Sheets Output (live data rows)**
![Google Sheets](screenshots/google-sheets.png)

**Screenshot 4 — PWA Install Prompt (Chrome on Android)**
![PWA Install](screenshots/pwa-install.png)

> **Test environment:** Google Chrome 153, Zorin OS 18.1 desktop, tested also on Android Chrome via Cloudflare Pages HTTPS URL. PWA manifest and service worker verified via DevTools → Application tab (15 precached assets).

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### Challenge 1: Node.js `crypto` / WebCrypto Availability During Build (`vite build` fails without polyfill)
**Problem:** The project's own `vite.config.ts` does `import crypto from 'node:crypto'` at the top to backfill `globalThis.crypto` (and `workbox-build`'s hashing code also relies on the WebCrypto global during `generateSW`). On Node versions / loader paths where `globalThis.crypto` is undefined, `npm run build` failed outright before Vite even started transforming modules.

**Resolution:** Two complementary shims, both local to this repo:
1. `vite.config.ts` top-of-file guard — patches `globalThis.crypto` from `node:crypto` at config-load time.
2. `crypto-polyfill.cjs` — same backfill, injected one process earlier via `NODE_OPTIONS='--require ./crypto-polyfill.cjs'` in the `dev` / `build` npm scripts, so tooling (`vite`, `workbox-build`) sees a defined `crypto` before any module evaluation.
Neither shim is bundled into the client output (load-bearing only at build/dev time); the PWA runtime uses the browser's native WebCrypto.

### Challenge 2: Apps Script `mode: 'no-cors'` Silently Swallows Server Response
**Problem:** The PWA sends POST data to Apps Script via `fetch()` with `mode: 'no-cors'` (required because Apps Script responses are opaque to cross-origin callers without explicit CORS headers). This means `response.status` is always `0` and `response.body` is unreadable — making it impossible to confirm whether data actually arrived in Google Sheets or the script silently failed.

**Resolution:** Acknowledged the trade-off explicitly in code (`src/services/syncService.ts`):
1. **Fetch-level failure only:** The `try / catch` around `fetch()` catches *transport* failures (offline, DNS, abort) — records are kept locally and the user is notified to retry.
2. **Server-level failure is invisible:** An opaque `no-cors` response always resolves successfully even if the Apps Script threw internally (e.g. the real production incident where `DriveApp` threw a permission error and zero rows were written while the PWA reported "success" and deleted local records). Mitigation added on the backend: `Code.gs` wraps all Drive calls in `try / catch` so permission gaps degrade to plain-text photo columns instead of aborting the row insert.
3. **Out-of-band verification:** `doGet()` health endpoint (returns `version` + `driveAccess` flag) plus the Google Sheet itself as source of truth — verified manually during development with `curl` GET/POST against the production `/exec` URL.
