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

## 1. Server setup (one-time)

Set an env var everywhere the app runs (Vercel project settings + the Cowork
environment): `TV_WEBHOOK_SECRET` = a random string. Keep the existing Upstash
Redis vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).

Deploy. Your webhook URL is `https://<your-app>.vercel.app/api/tv-webhook`.

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
Archive today's RON Scanner picks.

1. From the repo root run: node scripts/build-report.mjs
2. If it exits with NO_DATA (code 2), no TradingView alerts fired today —
   do NOT commit anything. Report "no picks today" in your summary and stop.
3. On success it writes reports/<date>.md. Commit it with message
   "Add daily scan report <date>" and push to the
   claude/scheduled-task-strategy-uynd2r branch.
4. Summarize: Tier 1 / Tier 2 counts and the top 3 tickers.
```

## Notes

- The `/api/scan` and `/api/cron` routes still exist (the old Yahoo engine) but
  are no longer scheduled. Safe to delete once TradingView is verified.
- The dashboard is unchanged — it reads the same `latest-scan` Redis key the
  webhook now populates.
- Pine criteria mirror `lib/criteria.js`. The Higher-Highs check uses
  `ta.pivothigh(close, 3, 3)`, the exact equivalent of the JS "higher than 3
  bars before and after" peak test.
