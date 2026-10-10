# User manual video — recording script

A shot-by-shot script for the screen-recorded user manual. Everything below is
taken from the app as it actually stands, so the clicks are the real clicks and
the labels are the real labels.

**Target length: about 10 minutes.** Twelve scenes, each one a separate take —
do not try to record it in one pass. If a take goes wrong, redo that scene only.

**The super administrator area is deliberately not in this video.** It is a
separate recording for whoever takes over the system, not for the sections.

---

## 1. Before you record

### Set the data up

```bash
php artisan migrate:fresh --seed      # clean slate, statuses and sections seeded
php artisan storage:link              # QR images 404 without this
npm run build
composer dev                          # server + vite
```

`migrate:fresh --seed` wipes everything. Do this on your development database,
never on the office's.

The seeder needs a password before it will make any accounts. Put this in
`.env`, run the seeder, then **delete the line again**:

```
EMPLOYEE_SEED_PASSWORD=SomethingOnlyYouKnow
```

### The accounts you will use

All of them sign in with a **username**, not an email address, and all share the
seeded password.

| Username | Section | What it does in this video |
|---|---|---|
| `rdo.counter` | RDO | Scene 4 — registers arrivals, nothing else |
| `rdo.staff` | RDO | Scenes 5, 11, 12 — completes referrals, oversight |
| `css.staff` | Client Support | Scenes 6, 7 — receives and forwards |
| `collection.staff` | Collection | Scene 8 — completes |
| `compliance.staff` | Compliance | Scene 9 — a section's own referral |
| `admin.staff` | Administrative | Scene 10 — transmittal and export |

### Seed some history first

A dashboard with nothing on it films badly, and the ageing colours need
documents of different ages to show anything. Before you record, register six
or seven referrals and move them around so that you have:

- two or three **Pending** documents less than six hours old (green)
- one **Pending** document over 24 hours old (red)
- two **Received** documents sitting on a desk
- one **Completed** document

The quickest way to age a document is to register it, then change its
`created_at` directly in the database. The ageing clock is read from the last
movement, so a document that has never been forwarded ages from `created_at`.

### Recording setup

- **1920×1080, browser zoom at 100%.** The sidebar and the document rows are
  built for a desk monitor; zoomed in, the layout reflows and looks broken.
- **Hide your bookmarks bar and any extensions.** Clean chrome, no personal
  tabs.
- **Two browser profiles side by side** for the handover scenes (6, 7, 11).
  One section cannot be signed into two accounts in one profile — the second
  login replaces the first. Two profiles lets you cut between "we sent it" and
  "they received it" without re-logging in on camera.
- **A webcam or phone held to the screen** for the QR scene. The scanner is a
  real camera scanner; there is no "type the number instead" fallback, so you
  need a printed or on-screen QR code to point at.
- **OBS**: scene per browser window, 30fps is plenty for a UI, record to MP4.

### What not to put on camera

- **No real taxpayer names.** Use `Juan Dela Cruz`, `Maria Santos`,
  `Pedro Reyes`. This is a BIR office and the recording will be passed around.
- **Not the super administrator area.** Out of scope for this video.
- **Do not forward anything to "Others" on camera.** It is a real destination
  for documents leaving the District, but no account sits there, so nothing can
  ever receive it — it stays Pending and goes red forever. Showing it raises a
  question this video cannot answer.
- **Do not narrate any rule about forwarding a document back to the section
  that registered it.** That rule is currently in dispute in the code. Keep the
  forwards in this video moving forward and the question never comes up.

---

## 2. The scenes

Narration is written to be read aloud. Read it slowly — roughly 150 words a
minute. Where it says *[pause]*, stop talking and let the screen do the work.

---

### SCENE 1 — Title (0:00 – 0:20)

**SCREEN:** The login page, or a title card over it.

**NARRATION:**

> This is the Document Tracking System for Revenue District Office 111.
>
> It answers one question, at any moment, for any document in this office:
> where is it, who has it, and how long has it been there.
>
> This video shows how each section uses it, from the counter to the archive.

---

### SCENE 2 — Signing in (0:20 – 0:50)

**SCREEN:** The login page.

**ACCOUNT:** `css.staff`

**CLICKS:**
1. Type the username in the login field — **username, not an email address**.
2. Type the password.
3. Sign in.

**NARRATION:**

> You sign in with the username your office administrator gave you. Not an
> email address — a username.
>
> The system knows which section you belong to, and it takes you straight to
> that section's own screen. You cannot see another section's desk, and you
> cannot act on a document that was never sent to you.

**ON SCREEN:** The CSS dashboard loads.

> **Note for the narrator:** do not explain the two different kinds of login.
> From a section's point of view there is only one, and the other one is the
> administrator area this video does not cover.

---

### SCENE 3 — The dashboard (0:50 – 1:30)

**SCREEN:** The CSS dashboard, straight after signing in.

**CLICKS:** None. Move the mouse to each of the three numbers as you name it.

**NARRATION:**

> Every section lands on the same screen, and it is deliberately about one
> thing: what has been sent to you and still needs receiving.
>
> Three numbers across the top. *[pause]*
>
> **Waiting to receive** — documents another section has sent here that nobody
> here has scanned in yet. These are your responsibility even though they are
> not yet in your hands.
>
> **On your desk** — documents you have received and not yet moved on. This is
> what you are actually accountable for right now.
>
> **Past the two-day limit** — anything that has been waiting more than
> forty-eight hours. When this number is not zero, something is stuck.
>
> Below them is the list itself, newest first, each one colour-coded by how
> long it has been waiting.

---

### SCENE 4 — Registering an arrival at the counter (1:30 – 2:30)

**SCREEN:** The registration desk.

**ACCOUNT:** `rdo.counter` — sign out and back in, or use the second browser
profile.

**CLICKS:**
1. Note that the sidebar has **one** item: *Register a referral*.
2. Click **Register a referral**.
3. Type `Juan Dela Cruz` in **Taxpayer's Name**.
4. Point at the **Date Issued** field — try to click it, show that it will not
   accept anything.
5. Click **Register**.

**NARRATION:**

> At the counter, a taxpayer is standing in front of you and all anybody has
> time to take is a name.
>
> So that is all this screen asks for. One field. *[pause]*
>
> The date is filled in by the system, at the moment you press Register, and
> you cannot change it. Not because we do not trust the clerk — because a date
> anybody can type is a date that proves nothing. This one is the real arrival
> time, and it is what the processing clock is measured from.
>
> Press Register, and the referral appears at the top of the list with its own
> reference number.

**ON SCREEN:** The new registration appears in *Registered by you*, with its
reference number and the time.

> This account does nothing else. It cannot receive, forward, or complete
> anything. It registers arrivals, and that is the whole job.

---

### SCENE 5 — Completing the referral and printing Form 2309 (2:30 – 4:00)

**SCREEN:** The RDO's Referrals screen.

**ACCOUNT:** `rdo.staff`

**CLICKS:**
1. Click **Referrals** in the sidebar — point out the badge showing how many
   arrivals are waiting to be completed.
2. Open the registration from scene 4.
3. Fill in **Receiving Section** — choose *Client Support Section*.
4. Fill in **Details** — type something real, e.g.
   `Verification of 2024 annual return`.
5. Save.
6. When the reference slip appears, click **Print**.

**NARRATION:**

> Later, at a desk, with the document actually in front of you, the referral
> gets completed. The number in the sidebar is how many are still waiting for
> this.
>
> Two things to add: which section it goes to, and what it is about. *[pause]*
>
> Everything in this office is addressed to the Chief, so the system writes
> that itself rather than asking. If the Chief is away and somebody else
> receives it, the movement trail records who — which is the honest answer,
> and better than a name typed into a form.
>
> Save it, and the system prints BIR Form 2309.

**ON SCREEN:** The reference slip, with its QR code.

**NARRATION:**

> This is the paper that travels with the document. A quarter sheet, with the
> QR code that the receiving section will scan.
>
> The boxes under "FOR" and the Remarks block are left blank on purpose. Those
> are ticked and written by hand on the hardcopy, the way they always have
> been. The system does not pretend to do it for you.
>
> Print it, attach it to the document, and walk the document over.

> **Note for the narrator:** the slip carries the older BIR seal. If anybody
> asks, that is deliberate — no memorandum has been issued changing the logo on
> Form 2309, so the paper keeps the mark it is approved with. Do not raise it
> unprompted.

---

### SCENE 6 — Receiving by QR code (4:00 – 4:50)

**SCREEN:** The CSS dashboard, then the scanner.

**ACCOUNT:** `css.staff` — the second browser profile.

**CLICKS:**
1. Point at the new row under *Documents on your desk*.
2. Click the row to open it.
3. Click **Scan QR to receive this document**.
4. Allow camera access when the browser asks.
5. Hold the printed slip up to the camera.

**NARRATION:**

> The document has physically arrived at Client Support. It is on their
> dashboard, waiting to be received.
>
> They open it, and scan the QR code on the slip. *[pause]*

**ON SCREEN:** The scanner recognises the code; the status changes to
**Received**.

**NARRATION:**

> Scanning is what records receipt. Not a button saying "I got it" — a scan of
> the actual paper, which means the document was genuinely in somebody's hands.
>
> The system checks two things before it accepts it: that this really is the
> section the document was addressed to, and that nobody has received it
> already. A document cannot be received twice, and it cannot be received by a
> section it was never sent to.
>
> From this moment the clock stops. The waiting time is frozen at however long
> it took to get here, and the person who scanned it is on record as holding
> it.

---

### SCENE 7 — Forwarding it on (4:50 – 5:40)

**SCREEN:** CSS → Documents.

**ACCOUNT:** `css.staff`

**CLICKS:**
1. Click **Documents** in the sidebar.
2. Open the document received in scene 6.
3. Click **Forward**.
4. Choose **Collection Section**.
5. Confirm.

**NARRATION:**

> Client Support has done its part, and the document needs to go to Collection.
>
> Open it, press Forward, choose the section. *[pause]*
>
> And now the important part: forwarding does not hand it over. It puts the
> document back into Pending, addressed to Collection, and waits.
>
> Collection has to scan it in themselves, exactly the way Client Support just
> did. Until they do, this document is still on Client Support's record as
> something they sent and nobody has picked up. Nobody can claim a document
> was handed over when it was not.
>
> Only the person holding the document can forward it — not a colleague, not
> somebody else in the same section.

**ON SCREEN:** The status flips back to Pending; the waiting clock restarts
from zero.

> The clock restarts here. Every leg of the journey is timed on its own, so a
> document that sat four days in one section does not make the next section
> look late.

---

### SCENE 8 — Completing a document (5:40 – 6:10)

**SCREEN:** Collection → Documents.

**ACCOUNT:** `collection.staff`

**CLICKS:**
1. Receive the document as in scene 6 (keep this quick — it is a repeat).
2. Open it and click **Mark as completed**.
3. Confirm at **Mark this document as completed?**

**NARRATION:**

> When the work is finished and the document is not going anywhere else, the
> section that holds it marks it completed.
>
> That is the end of the line. A completed document cannot be received or
> forwarded by anybody. It drops off every desk, and it stays in History with
> its full trail intact.
>
> Only the section actually holding it can do this, and only after they have
> received it.

---

### SCENE 9 — A section's own referral (6:10 – 7:00)

**SCREEN:** Compliance → Referrals.

**ACCOUNT:** `compliance.staff`

**CLICKS:**
1. Click **Referrals** — point out that the form looks different from the RDO's.
2. Note **Section Prepared** and **Date and Time** are already filled in.
3. Choose a **Receiving Section**.
4. Type a **Description**.
5. Click **Register**.
6. Print the slip.

**NARRATION:**

> The RDO's office issues BIR Form 2309. Every other section issues something
> different — an accountability slip.
>
> It exists for one reason: so that when a document moves between sections,
> there is paper saying who released it and who received it. *[pause]*
>
> Your section and the date and time are already filled in. You choose where it
> is going, and you describe what it is.
>
> There is no taxpayer field, and no second step. A section referral is
> complete the moment you save it.

**ON SCREEN:** The slip — half sheet crosswise, three columns by two rows, with
Inbound and Outbound signature blocks.

**NARRATION:**

> Half a sheet, crosswise. Signature blocks for both ends of the handover.
>
> The two forms are kept strictly apart. The RDO cannot issue this one, and no
> other section can issue Form 2309. They are different pieces of paper with
> different authority behind them, and the system refuses to let one section
> print the other's.

---

### SCENE 10 — The transmittal sheet and the Excel export (7:00 – 8:10)

**SCREEN:** Administrative Section → Transmittal.

**ACCOUNT:** `admin.staff` — have three or four documents in transit from this
section first.

**CLICKS:**
1. Click **Transmittal** in the sidebar.
2. Point at the destination buttons, each with its own waiting count.
3. Choose a destination.
4. Print the sheet.
5. Set a **From** and **To** date.
6. Click **Export to Excel** and open the file.

**NARRATION:**

> When somebody walks a stack of documents to another section, they want a
> signature saying the stack was handed over. The office has always kept that
> as a logbook. This is the logbook.
>
> Pick the section you are walking to — the count next to each one is how many
> you have waiting for them. *[pause]*
>
> And here is the part that matters: **you do not choose what goes on this
> sheet.** It lists exactly what the system says is in transit from you to
> them. Not a hand-picked subset.
>
> That is the whole point. If the paper and the system could disagree, the
> signature on the paper would mean nothing.
>
> A row disappears from this sheet the moment the receiving section scans it
> in. If something is still listed, it has not been received.

**ON SCREEN:** The Excel file opens.

**NARRATION:**

> The same list exports to Excel, for a date range, when the office needs to
> count or file it.
>
> Every row carries its own destination, the date it was registered, and how
> long it has been waiting. Sections only — the file carries no individual's
> name, because a spreadsheet gets emailed and forwarded, and names stay inside
> the section they belong to.

---

### SCENE 11 — Comments: chasing a stuck document (8:10 – 9:00)

**SCREEN:** RDO → Comments, then the receiving section's Comments inbox.

**ACCOUNTS:** `rdo.staff`, then `css.staff` in the second profile.

**CLICKS:**
1. As `rdo.staff`, click **Comments**.
2. Find a document that has been waiting too long.
3. Click **Send a comment**.
4. Type something real, e.g.
   `This has been with you five days. Please forward it to Collection or tell us what is holding it.`
5. Click **Send comment**.
6. Switch to `css.staff` — point at the badge on **Comments** in the sidebar.
7. Open the inbox, read the note, mark it read.

**NARRATION:**

> Most transactions start and end at the RDO's office, so that is the office
> that chases documents stuck elsewhere.
>
> This screen shows what is sitting too long, and lets the RDO write to the
> section holding it. *[pause]*
>
> The note goes to the section, not to one person — so it still gets read when
> somebody is on leave.
>
> On the receiving side, a number appears on Comments in the sidebar: how many
> notes nobody here has read yet. You open it, you read it, you mark it read —
> and the RDO can see that it was read, so it knows whether to chase again.

---

### SCENE 12 — Archiving, and History (9:00 – 9:50)

**SCREEN:** A section forwarding to Administrative, then RDO → Archive, then
History.

**ACCOUNT:** any section holding a document, then `rdo.staff`.

**CLICKS:**
1. Open a received document and click **Forward**.
2. Choose **Administrative Section** — the three options appear: *Chief*,
   *Authorized & Chief*, *Archive*.
3. Choose **Archive** and confirm at **Archive Document**.
4. As `rdo.staff`, click **Archive** in the sidebar and show the document there.
5. Click **History** and open any document's trail.

**NARRATION:**

> Not every document ends in completion. Sometimes the taxpayer simply stops
> responding, and the file cannot be finished or sent anywhere.
>
> When that document goes to the Administrative Section, there is a third
> option alongside Chief and Authorized & Chief: archive it outright. Closed
> out, with the reason recorded. *[pause]*
>
> Archived documents live on their own screen, so they are out of everybody's
> way but never lost.
>
> And finally, History. Every receipt, every forward, every completion is a
> row here — which section, which employee, what time. *[pause]*
>
> Nobody can edit it and nobody can delete it. A section that once handled a
> document keeps seeing it after it has moved on, so you can always answer for
> what passed through your hands.

---

### SCENE 13 — Close (9:50 – 10:10)

**SCREEN:** Back to a section dashboard.

**NARRATION:**

> That is the whole cycle. Registered at the counter, completed at a desk,
> scanned in by the section that receives it, forwarded or completed, and
> recorded at every step.
>
> Nothing in it depends on anybody remembering to write something down. The
> movement trail is the scan, and the scan is the document changing hands.

---

## 3. After recording

- **Watch it once with the sound off.** If a scene does not make sense from the
  screen alone, the narration is carrying too much.
- **Check for names and numbers.** Pause on every frame showing a document and
  confirm there is no real taxpayer in it.
- **Add captions.** The office will watch this on a laptop speaker in a room
  with other people in it.
- Keep the scene files. When a screen changes, you re-record that scene, not
  the video.
