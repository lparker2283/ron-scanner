# RON Scanner — TradingView (Pattern 1)

TradingView does the screening on your paid data; alerts push qualifying picks
to a webhook; a Cowork scheduled task archives the daily report to `reports/`.

```
TradingView (Pine alert)  ──webhook──▶  /api/tv-webhook  ──▶  Redis (latest-scan)
                                                                    │
                          dashboard reads it  ◀────────────────────┤
                                                                    │
        Cowork scheduled task ──▶ node scripts/build-report.mjs ──▶ reports/<date>.md ──▶ git push
```

Why this beats the old Yahoo cron: TradingView **initiates** the connection, so
the datacenter-IP block that 403'd Yahoo from the cloud never applies.

## 1. Env vars (one-time)

`TV_WEBHOOK_SECRET` is a password **you invent** (not something TradingView
gives you) so the webhook can verify alerts are really yours. Generate one with
`openssl rand -hex 16`.

| Where | Variable(s) | Why |
|---|---|---|
| **Vercel** project env | `TV_WEBHOOK_SECRET` + existing `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | The webhook route validates the secret and writes to Redis |
| **Pine script** input | the same `TV_WEBHOOK_SECRET` string | TradingView sends it in the alert payload |
| **Cowork** environment | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` only | `build-report.mjs` reads picks from Redis. It does **not** need the webhook secret |

Cowork env setup: claude.ai/code → click the cloud icon (environment selector) →
hover your environment → gear icon → **Environment variables** field (`.env`
format, one `KEY=value` per line, no quotes). If **Network access** is
**Trusted** and the task can't reach Redis, switch to **Custom** and add your
Upstash host (e.g. `your-db.upstash.io`) to **Allowed domains**. Note: Cowork
env vars are visible to anyone who can edit the environment — no secrets store
exists yet.

Deploy Vercel. Your webhook URL is `https://<your-app>.vercel.app/api/tv-webhook`.

## 2. TradingView setup (one-time per sector)

1. Pine Editor → paste `tradingview/ron-screener.pine` → **Add to chart** (use a **Daily** chart).
2. In the indicator settings set:
   - **Webhook secret** = the same `TV_WEBHOOK_SECRET`.
   - **Sector name** (e.g. `Technology`) and **Sector ETF** (e.g. `AMEX:XLK`).
3. Create the alert (the ⏰ icon):
   - Condition: **RON Scanner** → **Any alert() function call**
   - Trigger: **Once Per Bar Close**
   - Notifications → **Webhook URL** = your `/api/tv-webhook` URL
   - Leave the message box as-is — the script builds the JSON itself.
4. Repeat per symbol you want screened. Group a watchlist by sector so each
   symbol's **Sector ETF** input is correct. (TradingView paid plans allow many
   alerts; one alert per symbol on the Daily timeframe.)

The alert fires only when a symbol is a Tier 1 (5/5) or Tier 2 (≥3/5) pick.

## 3. Cowork scheduled task

Schedule for after the alerts have landed. Old Vercel cron was `0 11 * * 1-5`
(11:00 UTC weekdays). For an after-close archive use **`0 22 * * 1-5`**
(22:00 UTC / ~5pm ET). Paste this as the task instruction:

```
Archive and analyze today's RON Scanner picks.

1. From the repo root run: node scripts/build-report.mjs
2. If it exits with NO_DATA (code 2), no TradingView alerts fired today —
   do NOT commit anything. Report "no picks today" in your summary and stop.
3. On success it writes reports/<date>.md and prints a PICKS_JSON=... line
   with the structured picks. Read that JSON, then edit reports/<date>.md:
   - Replace the "<!-- ANALYST: ... -->" line under "## Market Read" with a
     2-4 sentence read on the day: which sectors are leading, how many
     Tier 1 vs Tier 2, and the overall risk posture.
   - Under each pick, add one line: "**Analyst take:** ..." — a concrete
     entry/avoid recommendation grounded in that pick's criteria (which of
     the 5 passed/failed, the RSI/volume/SMA values). Be specific, not
     generic. Flag overbought (RSI>70) or extended (wide range) names as
     wait-for-pullback rather than buy.
   Do not invent data — only reason from the criteria/values provided.
4. Commit reports/<date>.md with message "Add daily scan report <date>" and
   push to the claude/scheduled-task-strategy-uynd2r branch.
5. Summarize: Tier 1 / Tier 2 counts, the top 3 tickers, and your headline read.
```

This is the **analysis/recommendation** layer: TradingView supplies the
objective screen, Claude (in the scheduled task) writes the judgment calls.

## Notes

- The `/api/scan` and `/api/cron` routes still exist (the old Yahoo engine) but
  are no longer scheduled. Safe to delete once TradingView is verified.
- The dashboard is unchanged — it reads the same `latest-scan` Redis key the
  webhook now populates, including per-criterion `detail` strings and the
  `doubleConfirmed` flag, so the "View trade note" reasoning still renders.
- The old Yahoo engine (`/api/cron`, `/api/scan`, `lib/data.js`,
  `lib/scanner.js`) is kept as a manual fallback — run `node
  scripts/run-scan.mjs` if TradingView is ever unavailable. It is no longer
  scheduled.
- Pine criteria mirror `lib/criteria.js`. The Higher-Highs check uses
  `ta.pivothigh(close, 3, 3)`, the exact equivalent of the JS "higher than 3
  bars before and after" peak test.
