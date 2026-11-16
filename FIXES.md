# Phase 6 Review: Bug Fixes & Security Audit

## Manual Steps Required (Task 1 & 8)
1. **Rotate Secrets**: Go to the Neon console and rotate the master password. Change the `ADMIN_PASSWORD` in Vercel settings. 
2. **Git Hygiene**: To completely scrub the old `.env` from history, run BFG Repo-Cleaner locally and `git push --force`.
3. **Database Migration**: You MUST run the `schema.sql` file (specifically the 3 new `ALTER TABLE transfer_requests` commands) directly in the Neon SQL editor to prevent 500 errors on new cost center creation.

## Files Changed & Rationale
* **`backend/server.js`**: 
  * Replaced 500 crashes with standard JSON errors.
  * Extracted and enforced `requireEditor` and `assertCampAccess` middlewares to prevent API abuse.
  * Fixed relocation, edit-camp room corruption, check-in payloads, and cost-center payload inserts.
  * Added camelCase mapper in `/api/bootstrap` to match the exact properties the React components read.
* **`backend/scripts/seed.js`**: Changed absolute pathing and added `process.exit(1)` for CI safety.
* **`backend/schema.sql`**: Added `request_type` and dropped the hard foreign-key constraint on transfer requests to support 'SYS-CC'.
* **`frontend/src/utils/api.js`**: Added safe parsing for network timeouts to stop blank screens.
* **`frontend/src/App.jsx`**: 
  * Sent correct `employeeId` and `campNo` payload properties for transfers and check-ins.
  * Mapped `otherCosts` array to object format before passing it down to `InvoicingTab` to fix "undefined" UI bugs.
  * Added single-fire `window.alert` to prevent endless polling spam on disconnect.

## Notes & Skipped
* Skipped altering billing math/logic (explicitly out of scope).
* Confirmed via manual grep that `frontend/src/utils/apiSync.js` is not imported anywhere; safe to delete but left alone as it wasn't strictly required to delete it.
* Skipped Task 12 (Tailwind v3 downgrade) as the configuration files were not successfully generated in the environment.