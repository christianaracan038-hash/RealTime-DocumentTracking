# Documentation: Performance & Concurrency Fixes

This document summarizes all problems identified, solutions applied, and files changed during the optimization of the RealTimeDocumentTracking system.

---

## Table of Contents

1. [Critical Fixes: Race Conditions](#critical-fixes-race-conditions)
2. [High Priority: N+1 Queries & Performance](#high-priority-n1-queries-performance)
3. [Medium Priority: Database Indexes & Full-Text Search](#medium-priority-database-indexes-full-text-search)
4. [Low Priority: Overdue Count Optimization](#low-priority-overdue-count-optimization)
5. [Frontend Fixes: Search Debounce & Null Safety](#frontend-fixes-search-debounce-null-safety)
6. [Testing Checklist](#testing-checklist)
7. [Migration Instructions](#migration-instructions)
8. [Summary of Changed Files](#summary-of-changed-files)

---

## 1. Critical Fixes: Race Conditions

### Problem

Concurrent requests could cause:
- **Duplicate tracking numbers**: Two users registering documents simultaneously could get the same `document_id + 1` from `Document::max('document_id')`.
- **Lost updates**: Two staff editing the same document details could overwrite each other's changes.
- **Duplicate deletion requests**: Two users could submit deletion requests for the same document at the same time.

### Solution

Added `DB::transaction()` with `lockForUpdate()` to serialize access to the documents table during critical operations.

### Files Changed

| File | Changes |
|------|---------|
| `app/Services/DocumentService.php` | Added `lockForUpdate()` before `generateTrackingNumber()` in `register()` and `registerSectionReferral()`. Wrapped `updateSectionReferral()`, `requestSectionReferralDeletion()`, and `completeDetails()` in transactions with `lockForUpdate()`. Added idempotency check in `completeDetails()` (returns early if already completed). |

### Example

**Before:**
```php
$document = Document::create([
    'tracking_number' => $this->generateTrackingNumber(),
    // ...
]);
```

**After:**
```php
return DB::transaction(function () use ($data, $employee) {
    Document::query()->lockForUpdate()->latest('document_id')->first();

    $document = Document::create([
        'tracking_number' => $this->generateTrackingNumber(),
        // ...
    ]);
    // ...
});
```

---

## 2. High Priority: N+1 Queries & Performance

### Problem

- **N+1 queries**: Document lists eager-loaded some relations but missed `latestTrackingHistory`, causing extra queries when serialized to JSON.
- **Memory exhaustion**: `SectionDashboardController` used `get()` to load ALL documents into memory instead of paginating.

### Solution

- Added `latestTrackingHistory` to all eager loads in API controllers.
- Changed `get()` to `paginate(20)` in dashboard controller.
- Added `items()` to pass plain arrays to Inertia frontend.

### Files Changed

| File | Changes |
|------|---------|
| `app/Http/Controllers/Api/DocumentTrackingController.php` | Added `$document->load('latestTrackingHistory')` in `scan()` receive/forward modes. Added `'latestTrackingHistory'` to `fresh()` eager loads in `receive()`, `forward()`, and `complete()`. |
| `app/Http/Controllers/Admin/SuperAdminController.php` | Added `'status'` and `'latestTrackingHistory'` to `with()` in `deletions()`. |
| `app/Http/Controllers/Employee/SectionDashboardController.php` | Changed `get()` to `paginate(20)`. Changed `'documents' => $documents` to `'documents' => $documents->items()`. |

---

## 3. Medium Priority: Database Indexes & Full-Text Search

### Problem

- **Slow archive/deletion queries**: No indexes on `archived_at`, `deletion_requested_at`, `deletion_approved_at`, `document_date`.
- **Slow search**: `LOWER(column) LIKE '%keyword%'` with leading wildcard cannot use B-tree indexes. Full table scan on large datasets.

### Solution

- Created B-tree indexes for frequently filtered columns.
- Created PostgreSQL GIN Full-Text Search index for fast keyword search.
- Updated `applySearch()` to use `to_tsvector()` / `plainto_tsquery()` on PostgreSQL, with `LOWER() LIKE` fallback for SQLite.

### Files Changed

| File | Changes |
|------|---------|
| `database/migrations/2026_11_01_000000_add_missing_performance_indexes.php` | **NEW**. Adds indexes on `archived_at`, `deletion_requested_at`, `deletion_approved_at`, `document_date`. |
| `database/migrations/2026_11_03_140219_full_search_index.php` | **NEW**. Creates PostgreSQL GIN index on `to_tsvector()` of searchable columns. Safe to skip on SQLite. |
| `app/Services/DocumentService.php` | Updated `applySearch()` to detect driver (`pgsql` vs `sqlite`) and use appropriate search strategy. |

### Migration Details

**`2026_11_01_add_missing_performance_indexes.php`**:
```php
$table->index('archived_at');
$table->index('deletion_requested_at');
$table->index('deletion_approved_at');
$table->index('document_date');
```

**`2026_11_03_full_search_index.php`**:
```sql
CREATE INDEX documents_fulltext_search_idx ON documents USING GIN (
    to_tsvector('english', coalesce(tracking_number, '') || ' ' || coalesce(taxpayer_name, '') || ' ' || coalesce(concern, '') || ' ' || coalesce(reference_number, '') || ' ' || coalesce(description, ''))
);
```

---

## 4. Low Priority: Overdue Count Optimization

### Problem

```php
'overdue' => $documents
    ->filter(fn (Document $document) => $document->aging['overdue'] ?? false)
    ->count(),
```

- **Wrong count**: `filter()` runs on paginated results (20 items), not the full dataset.
- **N+1**: Each `aging` accessor triggers `latestTrackingHistory` query.

### Solution

Added `scopeOverdue()` to `Document` model that performs a single SQL query with `LEFT JOIN` on tracking histories.

### Files Changed

| File | Changes |
|------|---------|
| `app/Models/Document.php` | **NEW** `scopeOverdue(Builder $query, int $sectionId, ?int $overdueHours = null): Builder`. Uses `leftJoinSub` to get latest tracking history per document and filters by cutoff time. |
| `app/Http/Controllers/Employee/SectionDashboardController.php` | Changed `overdue` stat to use `Document::query()->overdue($employee->section_id)->count()`. |

### Example

**Before (PHP loop, wrong count):**
```php
'overdue' => $documents->filter(fn ($d) => $d->aging['overdue'] ?? false)->count(),
```

**After (SQL, correct count):**
```php
'overdue' => Document::query()->overdue($employee->section_id)->count(),
```

---

## 5. Frontend Fixes: Search Debounce & Null Safety

### Problem

- **Search too aggressive**: `SearchInput.jsx` debounced at 300ms, causing too many API requests.
- **React crash**: `documents.filter is not a function` because paginator object was passed instead of array.
- **React crash**: `Objects are not valid as a React child` because `document.aging` could be null.

### Solution

- Increased debounce from 300ms to 500ms.
- Added "Searching…" loading indicator with `onFinish`/`onError` callbacks.
- Passed `$documents->items()` to Inertia (plain array).
- Made `AgeBadge.jsx` null-safe with optional chaining.

### Files Changed

| File | Changes |
|------|---------|
| `resources/js/Components/Employee/SearchInput.jsx` | Debounce 300ms → 500ms. Added `isSearching` state with "Searching…" pulse indicator. Added `onFinish` and `onError` to `router.get()`. |
| `resources/js/Components/Employee/AgeBadge.jsx` | Changed `document.aging.overdue` → `document.aging?.overdue ?? false`. Changed `document.aging.hours` → `document.aging?.hours ?? 0`. |
| `app/Http/Controllers/Employee/SectionDashboardController.php` | Changed `'documents' => $documents` → `'documents' => $documents->items()`. |

---

## 6. Testing Checklist

Before deploying to production, verify the following:

### Race Conditions
- [ ] Open two browser tabs.
- [ ] Scan the same QR code simultaneously in both tabs.
- [ ] Verify only one document is processed; no duplicate tracking numbers.

### Search Performance
- [ ] Open dashboard with 1,000+ documents.
- [ ] Type a keyword in search.
- [ ] Verify results return quickly (no full table scan).
- [ ] Verify "Searching…" indicator appears.

### Dashboard Overdue Count
- [ ] Create documents with `tracked_at` older than 48 hours.
- [ ] Verify overdue stat matches the actual count, not just the 20 items on page.

### Pagination
- [ ] Register more than 20 documents.
- [ ] Verify dashboard shows pagination and does not load all records at once.

### Frontend Stability
- [ ] Open dashboard; no React console errors.
- [ ] Type rapidly in search box; only one API request after 500ms pause.

---

## 7. Migration Instructions

Run the new migrations:

```bash
php artisan migrate
```

**Note:** The Full-Text Search migration (`2026_11_03_140219_full_search_index.php`) checks the database driver and will skip index creation on SQLite. It is safe to run in all environments.

---

## 8. Summary of Changed Files

| Layer | File | Change |
|-------|------|--------|
| Service | `app/Services/DocumentService.php` | Race condition locks, FTS search strategy |
| API Controller | `app/Http/Controllers/Api/DocumentTrackingController.php` | Eager load `latestTrackingHistory` |
| Admin Controller | `app/Http/Controllers/Admin/SuperAdminController.php` | Eager load status + tracking history |
| Employee Controller | `app/Http/Controllers/Employee/SectionDashboardController.php` | Pagination, `items()`, `scopeOverdue()` |
| Model | `app/Models/Document.php` | **NEW** `scopeOverdue()` |
| Migration | `database/migrations/2026_11_01_000000_add_missing_performance_indexes.php` | **NEW** B-tree indexes |
| Migration | `database/migrations/2026_11_03_140219_full_search_index.php` | **NEW** PostgreSQL GIN FTS index |
| Frontend Component | `resources/js/Components/Employee/SearchInput.jsx` | Debounce 500ms, loading indicator |
| Frontend Component | `resources/js/Components/Employee/AgeBadge.jsx` | Null-safe aging access |

---

## Notes

- All database migrations are driver-aware (check `DB::getDriverName() !== 'pgsql'` before creating PostgreSQL-specific indexes).
- The `applySearch()` method falls back to `LOWER() LIKE` on SQLite for test suite compatibility.
- Debounce time of 500ms balances responsiveness with server load.
