# Delay Notice Feature

> Kapag natagalan ang dokumento sa isang section (3 days+), may makitang **delay notice** sa comments section para sa section head.

---

## Overview

| Item            | Value                                                |
| --------------- | ---------------------------------------------------- |
| Threshold       | 3 days (via `config('referral.aging.overdue_after)`) |
| Who adds reason | Receiver of the document                             |
| Who sees it     | Section head (via comments section)                  |
| Label           | `⚠️ Delay Notice`                                    |
| Table           | `document_comments` (with new `type` column)         |

---

## User Flow

1. Document received by section → sits for 3+ days → marked **overdue**
2. Receiver sees 🔴 **overdue badge** on document card
3. Receiver clicks badge → opens **Delay Reason Modal** → types reason → **Save**
4. Section head opens document detail → sees delay notice in comments section
5. Section head clicks **Acknowledge** → marked as read

---

## Database

### Migration

File: `database/migrations/2026_11_05_000000_add_type_to_document_comments_table.php`

```php
Schema::table('document_comments', function (Blueprint $table) {
    $table->string('type')->default('regular')->after('body');
    $table->index('type');
});
```

- Existing comments default to `'regular'` — no breaking changes
- New delay notices use `type = 'delay_notice'`

---

## Backend

### Model: `DocumentComment`

- Add `'type'` to `$fillable`
- Add scope `delayNotices()` to filter only delay notices

### Controller: `DocumentDelayReasonController`

| Method   | Endpoint                           | Action                     |
| -------- | ---------------------------------- | -------------------------- |
| `POST`   | `/api/documents/{id}/delay-reason` | Receiver adds delay reason |
| `GET`    | `/api/documents/{id}/delay-reason` | View delay reason          |
| `DELETE` | `/api/documents/{id}/delay-reason` | Remove delay reason        |

---

## Frontend

### Components

| Component               | Action                                                 |
| ----------------------- | ------------------------------------------------------ |
| `DelayReasonModal.jsx`  | **NEW** — Modal to add/view delay reason               |
| `IncomingDocuments.jsx` | Edit — Add 🔴 badge on overdue docs, trigger modal     |
| `DocumentComments.jsx`  | Edit — Show delay notices with `⚠️ Delay Notice` label |
| `AgeBadge.jsx`          | Edit — Optional: highlight overdue state               |

### UI Example

```
┌─────────────────────────────────────┐
│  DOC-2026-0500                      │
│  Status: Received                   │
│                                     │
│  ⚠️ DELAYED FOR 4 DAYS              │
│  Reason: Waiting for taxpayer's ID  │
│  Added by: Juan Dela Cruz           │
│  Date: Sep 26, 2026 2:00 PM         │
│                                     │
│  [✓ Acknowledge]                    │
└─────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Document sits 3+ days → shows overdue badge
- [ ] Receiver adds delay reason → saved as `type='delay_notice'`
- [ ] Section head opens document → sees delay notice in comments
- [ ] Section head clicks Acknowledge → marked as read
- [ ] Existing comments still show as `type='regular'`

---

## Migration Command

```bash
php artisan migrate
```

---

## Notes

- Uses existing `document_comments` table — no new table needed
- Delay notices are filtered by `to_section_id` so only the holding section sees them
- Acknowledgment works same as regular comments
