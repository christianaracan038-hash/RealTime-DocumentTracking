# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Real-time document routing/tracking system for a government office (RDO / Assessment sections). Employees register physical documents, the app generates a QR code per document, and other sections scan that QR to **receive** or **forward** the document, producing an auditable movement trail.

Stack: Laravel 13 (PHP 8.3) + Inertia.js 2 + React 18 + Tailwind 4 + Vite, PostgreSQL (Supabase in `.env`), Ziggy for named routes in JS, `simplesoftwareio/simple-qrcode` for QR generation, `html5-qrcode` for camera scanning.

## Commands

```bash
composer setup          # install deps, .env, key, migrate, npm install, build
composer dev            # server + queue:listen + pail (logs) + vite, all concurrently
composer test           # config:clear then artisan test
php artisan test --filter=AuthenticationTest          # single test class
php artisan test tests/Feature/Auth/LoginTest.php     # single file
vendor/bin/pint         # PHP formatting (Laravel Pint)
npm run build           # production asset build
php artisan migrate:fresh --seed                      # reset schema + seed statuses
php artisan storage:link                              # REQUIRED: QR images are served from public/storage
```

Tests run against in-memory SQLite (see [phpunit.xml](phpunit.xml)), not the Postgres dev DB.

## Architecture

### Two auth guards, one login form

Login is a single form ([LoginRequest.php](app/Http/Requests/Auth/LoginRequest.php)) that branches on whether the `login` field is an email:

- **email → `web` guard** (`users` table, `App\Models\User`) — admin, manages sections/roles/employee accounts under `/admin`.
- **username → `employee` guard** (`employees_acc` table, `App\Models\EmployeeAcc`) — the actual document workflow users.

`Auth::guard('employee')->user()` is used explicitly throughout employee-facing code; `$request->user()` returns only the admin. Anything touching documents must use the `employee` guard.

After login, [DashboardResolver](app/Services/DashboardResolver.php) maps the employee's `section_name` through [config/section.php](config/section.php) to a dashboard route. **A section with no entry in `config/section.php` cannot log in** — the login is rolled back with an error. Adding a new section means adding a config entry, a dashboard route/controller, and a `navigation.js` entry.

Section-scoped routes use the `section:NAME` middleware alias ([CheckEmployeeSection](app/Http/Middleware/CheckEmployeeSection.php)), e.g. `'auth:employee', 'section:RDO'`.

### Document lifecycle (the core domain)

Statuses are seeded rows, and **the code compares hard-coded status IDs**: `1 = Pending`, `2 = Received`, `3 = Completed` (see [DocumentStatusSeeder](database/seeders/DocumentStatusSeeder.php)). Do not reorder or re-seed statuses without auditing `status_id` comparisons in [DocumentTrackingController](app/Http/Controllers/Api/DocumentTrackingController.php), [DocumentService](app/Services/DocumentService.php) and the `aging` accessor on [Document](app/Models/Document.php).

1. **Register** — a referral (BIR Form 2309). `DocumentService::register()` creates the document (status Pending), generates `tracking_number` as `DOC-YYYYMMDD-000123`, renders an SVG QR whose payload is just the tracking number, and copies the sender's `section_code` into `office_code`. Choice lists (concerns, for, remarks, addressees) and the aging thresholds live in [config/referral.php](config/referral.php).
2. **Receive** — only an employee whose `section_id` equals the document's `destination_section_id`, and only while Pending. Sets `current_section_id = destination`, `current_employee_id = scanner`, status → Received.
3. **Forward** — only the employee in `current_employee_id`, and only while Received. Sets a new `destination_section_id` and resets status → **Pending** with `received_at = null`, so the next section must scan to receive it. **Cannot target the holder's own section or the section that registered it** (`creator->section_id`) — a document never goes back where it came from; if the work is done it is completed instead.
4. **Complete** — only the current holder, only while Received. Status → Completed, `completed_at` set. Terminal: nothing can be received or forwarded afterwards; it drops off "on my desk" lists and stays in History.

Every receive/forward/complete writes a `tracking_histories` row (`from_section_id`, `to_section_id`, `employee_id`, `action` = `RECEIVED`/`FORWARDED`/`COMPLETED`, `tracked_at`). That table is the history/audit source of truth — mutations happen inside `DB::transaction` with `lockForUpdate()` to avoid double-receive races.

**Aging.** `Document::$appends` carries `waiting_since` and `aging` (`band` fresh/aging/late, `hours`, `overdue`) so every listing colours documents identically. Only a **Pending** document ages — once received the clock stops and `aging` is `null`. The wait restarts on every forward (measured from the last `FORWARDED` row, else `created_at`). Any query that lists documents must eager-load `latestTrackingHistory` or the accessor costs a query per row.

**QR images** are served by `documents.qr` ([DocumentQrController](app/Http/Controllers/Employee/Documents/DocumentQrController.php)), which regenerates a missing SVG on first view. Never link to `qr_path` directly — the database is shared between machines, the files under `storage/` are not.

**Document visibility** for the History page is a deliberately broad OR query in `DocumentService::getHistoryDocuments()`: created by, currently held by, in the employee's section, destined for the section, *or* the section/employee appears anywhere in `tracking_histories`. So a section that once handled a document keeps seeing it after it moves on.

### Web vs API split

- `routes/web.php` — Inertia page renders (register form, documents held, history) via `Employee\Documents\DocumentController`.
- `routes/api.php` — scan/receive/forward, called with `fetch` from React. These are wrapped in the **`web` middleware group** so they use session cookies + the `employee` guard, not tokens. Exceptions render as JSON for `api/*` (see [bootstrap/app.php](bootstrap/app.php)).

`scan` is a pre-flight check: it takes `qr_value` plus `mode` (`receive`|`forward`), validates authorization/status, and for forward mode returns the selectable destination sections. The subsequent `receive`/`forward` call re-validates everything under lock — never rely on `scan` alone.

### Frontend conventions

- Inertia pages live in `resources/js/Pages/**`; `@/` aliases `resources/js/`.
- Named routes are available in JS via Ziggy's `route()` (`@routes` in [app.blade.php](resources/views/app.blade.php)); [navigation.js](resources/js/config/navigation.js) maps section name → sidebar items by route name.
- Shared props come from [HandleInertiaRequests](app/Http/Middleware/HandleInertiaRequests.php): `auth.user` (admin) and `auth.employee` (id, section_id, section_name).
- Layouts: `EmployeeLayouts.jsx` (sidebar + header) for the document workflow, `AuthenticatedLayout` for admin CRUD and profile, `GuestLayout` for auth. `AdminLayout.jsx` and `ManagementLayout.jsx` exist but are unused. Generic table/card/badge primitives are in `Components/Common/`.
- QR scanning is camera-based (`html5-qrcode`) in `RecieveDocumentScanner.jsx`, reused for both receive and forward via the `mode` prop; forward destination selection is `ForwardDocumentModal.jsx`.

## Gotchas

- Model primary keys are **not** `id`: `document_id`, `employee_id`, `section_id`, `role_id`, `status_id`, `tracking_history_id`. Relationships must name both foreign and owner keys explicitly.
- `employees_acc` has no `employee_name` column. The name columns are **`full_name`** and **`position`** (plus `email`), and `EmployeeAcc::$display_name` assembles them into "Atty. John Dela Cruz", falling back to `username` for the accounts that predate them. Never select `employee_name`; a rewrite once did and it returned `null` everywhere.
- **`full_name`, `position` and `email` are in `$hidden`, and `display_name` is deliberately not in `$appends`.** An employee is serialised as a document's creator, a comment's author and a movement's employee — payloads that go to other sections, and the office asked for names to stay inside the section. A caller entitled to them says so: `->makeVisible([...])` / `->append('display_name')` (the admin panel), or `nameVisibleTo($viewer)`, which returns `null` unless the viewer shares the section. There is a test pinning this.
- Individual names never reach the printed slip. The referral's `addressee` stays the fixed `config/referral.php` list ("Chief", "Authorized & Chief") — a data-privacy decision by the office, not an oversight.
- There is **one administrator tier**. Any `users` row can manage every account; the office holds one and the developers hold others until handover. Deactivating (not deleting) is how access ends, and `AdministratorController` refuses to switch off your own account or the last active one.
- `is_active` is enforced inside `LoginRequest` by being part of the credentials passed to `attempt()`, on **both** guards. Adding a login path elsewhere means enforcing it again.
- `DocumentController::index()` is unrouted dead code; `documents()` (route `documents.index`) renders the held-documents list.
- `resources/boostrap.js` is spelled that way and is what `app.jsx` imports.
- The shell default `php` may be 8.2; the project needs 8.3. A shim at `~/bin/php` points at Laragon's 8.3 for Git Bash tool calls.
- `vendor/bin/pint --test` flags ~30 pre-existing files repo-wide. Use `--dirty` so only your changes are checked.
- Seeders are idempotent by design (`firstOrCreate` on the natural key). `SectionSeeder` refreshes `description` on existing rows but never their `section_code`. `EmployeeAccountSeeder` reads its password from `EMPLOYEE_SEED_PASSWORD` in `.env` and never changes an existing password.
- Commits pushed straight to `main` bypass the test suite. Everything goes through a PR.
