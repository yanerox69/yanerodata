# Recon map: LALAL.AI for Desktop (Windows, macOS, Linux + web)

Scope: the core loop of the stem splitter. Load audio or video files (one or a
batch), pick the stems, preview for free, run the full split on the device or
in the cloud, then play, find and download the results, with a history.
Accounts are kept to sign-in. Plans and payments are out of the first slice.
For: a product to sell, on desktop (Electron) and web, from one codebase.
Date: 2026-10-15

Method: public pages only. No account was used, no app was installed, and
nothing was decompiled or captured from the network. Screen details come from
the marketing page, the FAQ and the blog posts, so the layout is **inferred**.
Before replica-design, add your own screenshots of the app to
`replica/screens/` (see "Gaps" at the end).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | desktop app page + FAQ | https://www.lalal.ai/desktop-app/ | features, stems for cloud vs local, formats, OS versions, sign-in, updates. v1.4.0 (2024-06-18) |
| 2 | pricing | https://www.lalal.ai/pricing/ | Starter free (10 min relaxed, 200MB), Lite $7.50/mo (90 fast min, 2GB), Pro $15/mo (250 fast min, local processing, VST, API). Packs 750/3000/5000 min |
| 3 | general FAQ | https://lalal.ai/guides/faq/ | minutes = length x stem types; code expires in 10 min; enhanced processing modes; noise levels; activation key |
| 4 | help center | https://www.lalal.ai/help/ | 26 how-to guides, one per job (karaoke, acapella, remove drums...) |
| 5 | local processing post | https://www.lalal.ai/blog/lyra-local-stem-separation-in-lalalai-desktop-app-and-vst-plugin/ | local vs cloud: offline, no minutes, 7 stems, 3 devices |
| 6 | 2022 launch post | https://www.lalal.ai/blog/lalalai-desktop-app/ | early UI: Split Files button, stem dropdown, Make Preview switch, folder icon, Preferences > Output folder |
| 7 | batch upload post | https://www.lalal.ai/blog/batch-upload/ | 20 files, per-file stem icon, header stem control, X to remove, Add File, "Process all files" |
| 8 | changelog | https://www.lalal.ai/changelog/ | 2026: VST plugin, drum and bass stems for their newest model, local processing added to Pro. No desktop entries since March |
| 9 | API overview | https://www.lalal.ai/api , https://www.lalal.ai/blog/meet-lalal-ai-api-v1/ | presets, multistem in one request, batch. Endpoints are not public without login, not used |
| 10 | terms of service | https://www.lalal.ai/terms-of-service/ | forbids reverse engineering and "derivative works based on the Service". No clause on competing products. See "Terms" |

## Core loop

Drop in a song, pick "vocals", hear a free preview, then split it and get two
files (the vocals and everything else) in your folder.

## Screens

IDs are stable. "how to reach" is the desktop app; the web app has the same
screens as routes.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Sign in: email | first launch, `/login` | start sign-in | logo, email input, continue button, terms link | empty, invalid email, sending |
| S02 | Sign in: code | after S01 | enter the 6-digit code from email | code input, resend link, back | wrong code, expired (10 min), resent |
| S03 | Workspace, empty | home after sign-in, `/` | start a split | drop zone, Select files button, formats hint, header with minutes balance and profile | empty, drag-over, unsupported file, file too big |
| S04 | Batch list | after picking files | set stems per file and start | file rows (name, length, format, size), per-row stem picker, header "set all" stem picker, remove (X), Add file, Process all | loading files, 1 file, 20 files, 21st file rejected, mixed audio and video |
| S05 | Stem and settings panel | stem picker on S04 | choose what to extract and how | stem list (10 cloud / 7 local), multistem checkboxes, mode switch cloud / local, model select, enhanced processing, de-echo, lead/back vocals, noise level | local-only stems disabled in cloud and vice versa, option unavailable for a stem |
| S06 | Processing | after Process all | watch progress | per-file progress bar, status (queued, uploading, splitting, done, failed), cancel | queued, in progress, failed with retry, offline (cloud) |
| S07 | Preview player | preview action on a row | hear a short clip before the full split | play/pause, scrub, stem / rest toggle (A/B), "split full file" button | generating, ready, error |
| S08 | Result | row done | use the outputs | two tracks per stem type (stem + rest) each with play, download, open folder; format label | done, file moved or deleted on disk |
| S09 | History | sidebar or tab, `/history` | find past splits | list by date, search, filter by stem, re-open, delete | empty, many items, item whose files are gone |
| S10 | Preferences | menu Tools > Preferences, or profile | app settings | output folder picker, default mode (local/cloud), default model, notifications on/off | default, folder not writable |
| S11 | Profile menu | avatar, top right | account things | email, minutes balance (fast / relaxed on hover), manage plan, check for updates, sign out | update available, up to date |
| S12 | Upgrade dialog | download on free plan, or local mode without Pro | explain the paid step | plan cards, compare, continue to checkout, not now | (out of slice 1, stub) |
| S13 | Local model setup | first use of local mode | get the on-device model | download size, progress, hardware note (GPU/NPU), retry | downloading, done, not enough disk, no GPU (CPU fallback, slower) |
| S14 | Finished notification | system notification | tell the user a long split is done | title, file name, click to open S08 | |

## Flows

```
F01 Sign in
    S01 email -> S02 code -> S03
    happy path clicks: 2 (continue, paste code + confirm)
    edge: code expired, wrong code 3 times, no email (spam folder hint), offline

F02 Split one song (the core loop)
    S03 drop file -> S04 -> S05 pick "vocals" -> S07 preview -> split full -> S06 -> S08 play / open folder
    happy path clicks: about 5 (drop, stem picker, vocals, split, open folder). Estimated, not counted on the real app
    edge: 2GB file, 1 hour file, corrupt file, video with no audio track, disk full, app closed mid-split

F03 Split a batch with different stems
    S03 select 20 files -> S04 set all to "instrumental", change 3 rows to "drums" -> Process all -> S06 -> S08 per file
    edge: 21 files, one file fails while others continue, remove a file during upload, mixed formats

F04 Preview, then decide
    S04 -> S07 preview (free, unlimited) -> A/B stem vs rest -> split full or pick another stem/model
    edge: preview on a 10 second file, switching model and re-previewing

F05 Split offline on the device
    S10 or S05 switch to local -> S13 first-time model download -> S04 -> S06 (no upload, no minutes) -> S08
    edge: no GPU, laptop on battery, a cloud-only stem selected, offline for longer than the licence check allows

F06 Re-open an old result
    S09 history -> item -> S08
    edge: output files moved or deleted, history from another device (cloud only)

F07 Change where results go
    S11 or menu -> S10 -> pick folder -> next split saves there
    edge: folder on a removed drive, no write permission

F08 Clean a voice recording (noise reduction)
    S03 -> S05 "voice and noise", noise level -> S07 -> S06 -> S08
    edge: music under the voice, very quiet recording

F09 Update the app
    S11 check for updates -> download -> restart
    edge: update fails, no network
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, icon | default, hover, focus, disabled, loading | all |
| Text input / code input | email, 6-digit code | empty, filled, error | S01, S02 |
| Drop zone | full, compact (above the list) | idle, drag-over, rejected | S03, S04 |
| File row | upload, queued, processing, done, failed | hover shows remove | S04, S06, S08, S09 |
| Stem picker | single, multi | open, closed, option disabled with reason | S04, S05 |
| Segmented switch | cloud / local, stem / rest | | S05, S07 |
| Select | model, noise level, enhanced mode | | S05, S10 |
| Toggle | de-echo, lead/back, notifications | on, off, disabled | S05, S10 |
| Progress bar | determinate, indeterminate | | S06, S13 |
| Audio player | mini (row), full (preview) | loading, playing, paused, error | S07, S08 |
| Waveform | static | | S07, S08 |
| Header bar | | minutes balance, avatar | all after sign-in |
| Sidebar / tabs | workspace, history | active | S03, S09 |
| Menu | profile menu | | S11 |
| Modal | upgrade, confirm delete, error | | S12, S09 |
| Toast | success, error, info | | all |
| Folder picker | native dialog | | S10 |
| Empty state | workspace, history | | S03, S09 |

## Inferred data model

```
User          id, email, created_at, plan (free | lite | pro)
              evidence: S01/S02 sign-in by email code; pricing page plans
              confidence: high

Device        id, user_id, name, os, activated_at, last_check_at
              evidence: "activate on up to three computers"; occasional subscription check offline
              confidence: medium

MinuteBalance user_id, fast_minutes_left, relaxed_unlimited (bool), resets_at
              evidence: header balance, fast/relaxed queues, fast minutes reset monthly
              confidence: high

MinuteLedger  id, user_id, job_id, minutes (length x stem types), queue (fast | relaxed), at
              evidence: FAQ formula; balance goes down per split
              confidence: guess (how they store it is not public)

SourceFile    id, user_id, name, format, kind (audio | video), duration_s, size_bytes,
              sample_rate, channels, local_path (desktop) or storage_key (cloud)
              evidence: formats list, 2GB / 200MB limits, minutes by length
              confidence: high on fields, guess on storage

SplitJob      id, user_id, source_file_id, stem_types[] (multistem), mode (local | cloud),
              model, enhanced (off | clear_cut | deep_extraction), de_echo (bool),
              lead_back (bool), noise_level (mild | normal | aggressive),
              is_preview (bool), status (queued | uploading | processing | done | failed),
              error, progress, created_at, finished_at, batch_id
              evidence: S05 settings, S06 states, preview vs full split, batch of 20
              confidence: high on settings, medium on statuses

Batch         id, user_id, created_at, job_ids
              evidence: batch upload, "Process all files", single queue
              confidence: medium

StemOutput    id, job_id, stem_type, role (stem | rest), format, path or url, duration_s
              evidence: "each separation type yields two stems per file"
              confidence: high

Preferences   user_id or local, output_folder, default_mode, default_model, notify
              evidence: Preferences > Output folder; desktop notification
              confidence: high on output_folder, guess on the rest
```

Relationships: User 1-n Device, User 1-n SourceFile, SourceFile 1-n SplitJob,
Batch 1-n SplitJob, SplitJob 1-n StemOutput, User 1-1 MinuteBalance,
User 1-n MinuteLedger. History = the user's SplitJobs with is_preview false,
newest first.

On desktop, local mode does not need the server: SourceFile, SplitJob and
StemOutput can live in a local SQLite file. Cloud mode and the web app need the
same tables in Postgres.

## Feature matrix

See `features.csv`. Must: 17, should: 14, could: 11, skip: 6.

## Out of scope (cannot or should not be cloned)

- **Their neural networks.** The separation models are what the company owns
  and trains. They are not features you can rebuild by watching the app. We
  use open-licensed separation models instead (replica-architect picks them
  and checks each one's licence for commercial use). Quality will be close on
  vocals, drums and bass, and weaker on piano, guitar, synth, strings and wind.
- **Voice packs and voice cloning**, the **VST plugin**, the **mobile apps**,
  the **developer API** and the **affiliate program**. Not in this slice.
- **Plans and payments** are in the matrix as should/could. They come after the
  core loop works, with replica-backend.

## Terms

No account was used. The terms forbid reverse engineering the service and
"derivative works based on the Service". This recon looked only at public
pages, and the build writes everything fresh, with no code, models, assets or
copy from the original. Still: if you have a LALAL.AI account, do not use it to
study the app for this project, and ask a lawyer before you sell.

## Gaps (to fill before replica-design)

- No screenshots of the real app. Install it on your own computer, sign in with
  your own free account only if its terms allow it for your purpose, or use
  public videos and store pages. Save screenshots as `replica/screens/S03.png`
  and so on at 1440x900.
- The happy-path click count for F02 is estimated. Count it by hand once.
- The preview length and the cloud upload limits for the desktop app are not
  public.

## Size

Screens 14, flows 9, entities 9. Hard parts:

1. **Separation quality and speed on the device**: running a separation model
   in an Electron app on Windows, macOS (Apple Silicon and Intel) and Linux,
   with GPU when there is one and an acceptable speed on CPU when not.
2. **Two runtimes, one product**: local processing on desktop plus a GPU queue
   server for the web, with the same settings and results.
3. **Big media files**: 2GB uploads, video decoding (ffmpeg), keeping the
   original format on export, and long jobs that survive closing the window.

Plus payments and minutes later. Size: **L** (a quarter) for both platforms.
The desktop app with local processing alone is **M** (a few weeks).
