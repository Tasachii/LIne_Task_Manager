# LINE Task Manager

A Kanban board integrated with LINE group chats. A bot reads messages in a LINE group, extracts actionable tasks, and places them on a four-column board (`Todo → In Process → Test → Done`). Status changes and assignments are pushed back to the group automatically.

For a complete onboarding reference (architecture, data model, API, conventions), see [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

## Screenshots

The Kanban board — four columns, priority and due-date badges (overdue cards turn red), drag-and-drop, and per-card assignment:

![Kanban board](docs/review/board-overview.png)

When `BOARD_PASSWORD` is set, the board is gated by a password (compared in constant time):

![Locked board](docs/review/board-locked.png)

## Project Status

The full message-to-board pipeline is **implemented and verified locally** — a signed webhook payload
flows through signature check → dedupe → extraction → persistence → realtime board update → group reply,
covered by unit, integration, and end-to-end tests.

What is **not** done for you, because it needs your own credentials and a public URL: connecting the bot
to a **real LINE Official Account** and a live group. Until the checklist below is complete, the bot
cannot receive messages from an actual LINE group.

### Go-Live Checklist

Complete these in order to take the bot from "runs locally" to "reads tasks from a real LINE group".
Detailed steps for each are in [Connecting a LINE Official Account](#connecting-a-line-official-account).

- [ ] **1. Create a LINE Messaging API channel** in the [LINE Developers Console](https://developers.line.biz).
- [ ] **2. Put real credentials in `backend/.env`** — `LINE_CHANNEL_SECRET` and `LINE_CHANNEL_ACCESS_TOKEN`.
      (Local tests use `LINE_CHANNEL_SECRET=test_secret` and no token, so live LINE calls return 401 — that is expected in dev.)
- [ ] **3. Set `BOARD_PASSWORD` and `CORS_ORIGIN`** before exposing the board publicly.
- [ ] **4. Run the stack** — `docker compose --profile full up -d --build` (board + webhook served on `:8080`).
- [ ] **5. Expose a public HTTPS URL** to `:8080` — `ngrok http 8080` for testing, or deploy behind a real domain.
- [ ] **6. Configure the webhook in LINE** — set Webhook URL to `https://<your-domain>/webhook`, click **Verify** (must report Success), and enable **Use webhook**.
- [ ] **7. Allow group chats** — in LINE Official Account Manager: Webhooks **on**, Auto-response **off**, and enable **Allow bot to join group chats**.
- [ ] **8. Invite the bot to a group** and send `/task ...` (one line per task). Cards should appear on the board, and the bot should reply in the group.
- [ ] **9. (Optional) Enable no-keyword AI intake** — set `ANTHROPIC_API_KEY` so plain messages that describe work become cards without the `/task` keyword.

> **How task detection works:** without `ANTHROPIC_API_KEY`, only messages starting with `/task` create cards
> (one line = one task); plain chat is ignored. With the key set, the AI also classifies keyword-free messages.

## Features

- Task intake from LINE via the `/task` keyword; one line per task, with deduplication on LINE webhook retries
- Optional AI classification of natural-language messages (no keyword required) using the Claude API, enabled by setting `ANTHROPIC_API_KEY`
- Priority tokens (`!high`, `!low`, plus Thai aliases) and due dates (`@YYYY-MM-DD`) parsed onto cards, with overdue indicators
- Four-column Kanban board with cross-column drag and drop and persistent in-column ordering
- LINE push notifications on status change and assignment, with configurable status filtering to limit message quota usage
- Realtime board updates for all connected clients over WebSocket, with a reconnection banner on connection loss
- Shared board password (`BOARD_PASSWORD`) protecting both REST and WebSocket access, plus configurable CORS
- Full Docker deployment (PostgreSQL, backend, frontend behind nginx) exposed through a single public URL for both the board and the LINE webhook
- Unit tests, end-to-end tests, and GitHub Actions CI

## Repository Layout

| Path | Description |
|---|---|
| `backend/` | NestJS application: LINE webhook, REST API, WebSocket gateway, AI extraction, PostgreSQL access |
| `frontend/` | React + Vite + dnd-kit Kanban board, with `nginx.conf` for production |
| `migrations/` | SQL migrations (`line_messages`, `users`, `tasks`) |
| `docs/` | System design document and interactive flow diagrams |
| `docker-compose.yml` | PostgreSQL for development; full stack via the `full` profile |
| `.github/workflows/` | CI: build and test for backend and frontend |

## Development Setup

Requires Node.js 20+ and Docker.

```bash
# 1. PostgreSQL
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env        # fill in LINE channel credentials
npm run migrate
npm run start:dev           # http://localhost:3000

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## Production Deployment (Docker)

```bash
cp backend/.env.example backend/.env   # fill in all values (see table below)
docker compose --profile full up -d --build
```

- The board and webhook are served behind nginx at `http://localhost:8080`. Point your domain or tunnel at this single endpoint.
- The backend waits for the database, runs migrations automatically on startup, and exposes a health check at `/health`.

### Environment Variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `LINE_CHANNEL_SECRET` | Yes | From the LINE Developers Console; used to verify webhook signatures |
| `LINE_CHANNEL_ACCESS_TOKEN` | Yes | From the LINE Developers Console; used to send messages |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `TASK_KEYWORD` | No | Keyword that marks a message as a task (default `/task`) |
| `BOARD_PASSWORD` | Recommended | Board access password; unset disables auth (development only) |
| `CORS_ORIGIN` | Recommended | Allowed board origin, e.g. `https://board.example.com`; unset allows `*` |
| `NOTIFY_STATUSES` | No | Comma-separated statuses that trigger group notifications (default: all). Set e.g. `done` to conserve quota |
| `NOTIFY_ASSIGN` | No | Notify the group when a task is assigned (default `true`) |
| `ANTHROPIC_API_KEY` | No | Enables AI classification of messages without the keyword |
| `AI_EXTRACT_MODEL` | No | Claude model for extraction (default `claude-haiku-4-5`, the low-cost default; use `claude-opus-4-8` for higher accuracy) |
| `THROTTLE_LIMIT` | No | Max board-API requests per IP per window (default `120`) |
| `THROTTLE_TTL_MS` | No | Rate-limit window in milliseconds (default `60000`). The LINE webhook and `/health` are exempt |

## Connecting a LINE Official Account

### LINE Developers Console (https://developers.line.biz)

1. Create a Provider and a **Messaging API channel** (this is the bot's LINE Official Account).
2. **Basic settings** tab: copy the **Channel secret** into `backend/.env` as `LINE_CHANNEL_SECRET`.
3. **Messaging API** tab: click **Issue** under Channel access token (long-lived) and set `LINE_CHANNEL_ACCESS_TOKEN`.
4. Open a tunnel to nginx: `ngrok http 8080` (or `ngrok http 3000` when running the backend directly in development).
5. Set the **Webhook URL** to `https://<your-domain>/webhook`, click **Verify** (it must report Success), and enable **Use webhook**.
6. In **LINE Official Account Manager** (https://manager.line.biz), under Settings → Response settings: set **Chat** off, **Auto-response** off, **Webhooks** on, and **Greeting message** off.
7. Under Settings → Account settings, enable **Allow bot to join group chats**; without this the bot cannot be invited to a group.

### Trying It Out

8. Invite the bot to a group. It posts a greeting with usage instructions.
9. Send a message in the group:

```
/task Fix the login button on the landing page !high @2026-07-01
Change the button color to green
```

This creates two cards in Todo (the first with high priority and a due date), and the bot confirms the intake in the group.

If `ANTHROPIC_API_KEY` is set, plain messages that describe work (for example, a bug report written conversationally) are converted to cards without the keyword, while ordinary conversation is ignored.

### Group Notifications

- Moving a card across columns pushes a status update to the group.
- Assigning a task pushes an assignment notice.
- Restrict notifications to specific statuses with `NOTIFY_STATUSES`. Push messages consume the Official Account's message quota (the free plan includes roughly 300 messages per month).

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/webhook` | LINE signature | Receives events from the LINE platform |
| GET | `/health` | None | Health check, including database connectivity |
| GET | `/tasks` | `x-board-key` | List all tasks, ordered by column position |
| PATCH | `/tasks/:id/status` | `x-board-key` | Change status (card is appended to the target column) |
| PATCH | `/tasks/:id/move` | `x-board-key` | Move a card to `{status, index}`; used by drag and drop |
| POST | `/tasks/:id/assign` | `x-board-key` | Assign a task: `{userId, displayName}` |

WebSocket events (clients must send `auth.key` when a password is set): `task:created`, `task:updated`, `tasks:refresh`.

## Testing

```bash
# Unit tests (task extraction: keyword, priority, due date, grapheme-safe truncation)
cd backend && npm run build && npm test

# Integration tests (real PostgreSQL: position ordering and concurrency of createTask/move).
# Requires Postgres up and migrated.
docker compose up -d && npm run migrate && npm run test:integration

# End-to-end tests (drives a real Chrome session: board rendering, realtime updates, drag and drop).
# Requires the backend on :3000 (started with LINE_CHANNEL_SECRET=test_secret) and Vite on :5173.
cd frontend && npm run test:e2e
```

GitHub Actions builds, unit-tests, and integration-tests the backend (with a Postgres service) and
type-checks and builds the frontend on every push and pull request.

## Design Decisions

| Topic | Decision |
|---|---|
| Task detection | `/task` keyword, with optional AI classification enabled by `ANTHROPIC_API_KEY` |
| Multiple tasks per message | Each line after the keyword becomes one task |
| Duplicate prevention | `message_id` is checked before insert to absorb LINE webhook retries |
| Card ordering | A per-column `position` is persisted; ordering survives moves, inserts, and page refreshes |
| Ordering integrity | Position writes (`create`, `move`, status change) run in a transaction and serialize on a per-column advisory lock, so concurrent edits cannot corrupt order |
| Authentication | A single shared board password, compared in constant time (LINE Login is planned) |
| Rate limiting | Per-IP throttle on the board API; webhook and health checks are exempt |
| AI failure handling | Fail-open: if extraction errors or times out, the message is skipped and the webhook is never blocked |

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the prioritized, handoff-ready backlog (with code pointers
and acceptance criteria). In short:

- **P0 (before multi-team use):** LINE Login + per-group board isolation
- **P1:** edit/delete cards from the board; weekly statistics posted to the group
- **P2:** structured logging/metrics; run e2e in CI
