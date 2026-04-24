# Backend Todo

Gaps discovered during frontend development. Each item has a frontend workaround in place.

---

## User model

- [x] Add `hue` field (`Number`, default: random 0–360) ✅

---

## Workspace model

- [x] Add `slug` field (auto-generated from name, unique) ✅
- [x] Add `settings` field (accent, font, density, timezone, date_format, language) ✅

---

## Workspace API

- [x] `GET /workspace` — now returns `_id`, `slug`, `memberCount`, full `role` object ✅
- [x] `PATCH /workspace/:id` — update name + settings ✅
- [x] `GET /workspace/:id/stats` — Redis-cached ✅
- [x] `GET /workspace/:id/activity` — activity feed, 90-day TTL ✅
- [x] `GET /workspace/:id/my-tasks?status=todo,in_progress` — cross-project task query ✅

---

## Project model

- [x] Add `key` field (auto-derived from name, unique per workspace) ✅
- [x] Add `color` field (hex, assigned from palette on create) ✅
- [x] `taskCount` and `done` now returned via aggregation in GET responses ✅

---

## Project API

- [x] `GET /workspace/:id/project` — now returns `key`, `color`, `taskCount`, `done` ✅
- [x] `POST /workspace/:id/project` — now accepts `key` and `color` ✅
- [x] `PATCH /workspace/:id/project/:id` — now accepts `color` ✅

---

## Task model

- [x] Add `key` field (auto-generated via Redis counter, format `PROJ-N`) ✅
- [x] Add `priority` field (`urgent | high | med | low | none`, default `med`) ✅
- [x] Add `labels` field (`[String]`, default `[]`) ✅
- [x] Add `due` field (`Date`, optional) ✅

---

## Task API

- [x] `GET /task` — now returns `key`, `priority`, `labels`, `due` ✅
- [x] `POST /task` — now accepts `priority`, `labels`, `due` ✅
- [x] `PATCH /task/:id` — now accepts `priority`, `labels`, `due` ✅

---

## Comments API

- [x] `GET /workspace/:id/project/:id/task/:id/comments` ✅
- [x] `POST /workspace/:id/project/:id/task/:id/comments` ✅

---

## Redis (Upstash) ✅

- [x] Permission caching — `ws_member:{wsId}:{userId}`, 5 min TTL ✅
- [x] Invalidated on role permission update (bulk scan-delete) ✅
- [x] Invalidated on member role change / remove (single key delete) ✅
- [x] Workspace stats caching — 60s TTL ✅
- [x] Task key counter per project via `INCR` ✅

---

## Do later (low priority — no frontend blocker)

- [ ] `POST /workspace/create` — rename to `POST /workspace` (REST standard)
  - Frontend already uses `/create` path, low impact
- [ ] `GET /workspace/:id/my-role` — dedicated endpoint for current user's role in a workspace
  - Frontend uses stub Role from workspace list response
- [ ] `GET /workspace/:id/project/:id/members` — members scoped to a project
  - Frontend: no member avatars on project cards / kanban assignee filter

---

## Do later (auth & account features)

- [ ] Google OAuth — `GET /auth/google` + `GET /auth/google/callback` (Passport.js)
- [ ] Invite by email — current `addMember` requires `userId`, not email
- [ ] API token management — `GET/POST/DELETE /user/tokens`
- [ ] Avatar upload — `POST /user/avatar`
- [ ] Account deletion — `DELETE /user/account`
- [ ] AI digest — `GET /workspace/:id/ai-digest`
