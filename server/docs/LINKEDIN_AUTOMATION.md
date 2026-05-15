# LinkedIn browser automation

This feature runs **Playwright** against the LinkedIn website using credentials stored **encrypted** in MySQL. It is intended for **admin-only** operation with a separate **worker process**.

## Legal and operational risk

LinkedIn’s terms generally prohibit unattended browser automation, bulk connection requests, and scraping. Expect **account warnings, captchas, or bans**, especially from **cloud/datacenter IPs**. Use a dedicated account, conservative `max_invites`, and run from an environment as close to a normal user as practical.

## Processes

1. **API** (`npm run dev` / `node index.js`): CRUD for settings and campaigns; starting a campaign sets `status = queued` and optionally enqueues a **BullMQ** job.
2. **Worker** (`npm run worker:linkedin` from `server/`):  
   - If `REDIS_URL` is set: consumes the `linkedin-campaigns` BullMQ queue.  
   - Otherwise: **polls MySQL** every `LINKEDIN_WORKER_POLL_MS` (default 5000) for `status = queued` campaigns.

Do **not** run DB-poll and Bull workers against the same queue without coordination; use **either** Redis-driven jobs **or** DB polling.

## Environment variables

| Variable | Description |
|----------|-------------|
| `ENCRYPTION_KEY` | Same 64-hex key used for other secrets (required for credential storage). |
| `REDIS_URL` | Optional. If set, `POST .../campaigns/:id/start` enqueues BullMQ; worker uses Bull only. |
| `LINKEDIN_WORKER_POLL_MS` | Poll interval when not using Redis (default `5000`). |
| `LINKEDIN_MAX_INVITES_CAP` | Server-side ceiling for `max_invites` (default `50`, max `200`). |
| `PLAYWRIGHT_HEADLESS` | Set to `false` for visible browser when debugging locally. |

## Playwright browsers

After `npm install` in `server/`, install browsers once:

```bash
cd server
npx playwright install chromium
```

In Docker/CI, add the same step to the worker image.

## Selector maintenance

LinkedIn changes the DOM frequently. Update selectors in:

`server/services/linkedinAutomation/runCampaign.js`

Keep login, search, result cards, profile **Connect** flow, and modal **Send** locators in one module so QA can patch quickly.

## MySQL

Large payloads are unrelated here, but ensure `max_allowed_packet` is adequate if you log huge JSON blobs later.
