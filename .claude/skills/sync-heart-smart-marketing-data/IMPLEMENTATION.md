# Implementation: Sync Heart Smart Marketing Data

This file documents the step-by-step workflow that Claude executes when `/sync-heart-smart-marketing-data` is invoked.

## Execution Flow

### Phase 1: Analyze & Plan
1. Parse user input (date range, flags)
2. Query BigQuery to find missing date ranges in `heart_smart_au.marketing_ad_spend_daily`
3. Determine what to sync (Meta, GHL, or both)
4. Report plan to user

### Phase 2: Meta Ads Data Sync

#### Step 1: Detect Missing Dates
```sql
SELECT MAX(date) as last_date, COUNT(*) as total_records
FROM `jv-data-warehouse.heart_smart_au.marketing_ad_spend_daily`
```
- If `--meta-since` flag: use provided date
- If `--meta-days` flag: use last N days
- Default: Sync from MAX(date) to TODAY (fills forward to current date)

#### Step 2: Query Meta MCP
For each date in the range, call Meta Ads tool:
- **ad_account_id**: `510603536638743` (Heart Smart AU)
- **level**: `ad_account`
- **fields**: `amount_spent`, `impressions`, `actions:link_click`, `lead`
- **time_range**: `{"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}`
- **time_increment**: `1` (daily)
- **client_conversation_id**: Generate 20-char ID

Parse response:
```json
{
  "date_start": "2026-08-20",
  "amount_spent": "A$500.00 AUD",
  "impressions": "25000",
  "actions:link_click": "250",
  "lead": "12"
}
```

Extract numeric values:
- `spend`: Parse "A$500.00" → 500.00
- `impressions`: 25000
- `link_clicks`: 250
- `leads`: 12

#### Step 3: Upsert to BigQuery
For each date pulled:

```sql
-- Check if date exists
SELECT COUNT(*) FROM `jv-data-warehouse.heart_smart_au.marketing_ad_spend_daily` WHERE date = '2026-08-20'

-- If exists: SKIP (no duplicates)
-- If not exists: INSERT
INSERT INTO `jv-data-warehouse.heart_smart_au.marketing_ad_spend_daily`
  (date, spend, impressions, link_clicks, leads, synced_at)
VALUES
  ('2026-08-20', 500.00, 25000, 250, 12, CURRENT_TIMESTAMP())
```

Report after each insert:
- Date added
- Spend amount
- Records inserted/skipped

### Phase 3: GHL Pipeline Sync

**Status**: ✅ **ACTIVE** — Uses Heart Smart GHL API key

#### Step 1: Get GHL Secrets from GitHub
```
GHL_API_KEY_HEART_SMART = from github.com secrets
GHL_LOCATION_ID = 9D1lM8MPCly9IoR5YCIa
GHL_PIPELINE_ID = fVjHZmcsCSemRfeoRBct
```

#### Step 2: Query GHL Pipeline Stages
Call GHL API endpoint: `GET /opportunities/pipeline/{pipelineId}/stages`

Headers:
```
Authorization: Bearer {GHL_API_KEY_HEART_SMART}
Content-Type: application/json
```

For each stage in pipeline, query:
```
GET /opportunities?stageId={stageId}&limit=100
```

Response includes:
- `stageName` (e.g., "Optin", "Registered GA", "VIP Upgrade")
- `count` (number of opportunities in stage)

#### Step 3: Insert to BigQuery
```sql
INSERT INTO `jv-data-warehouse.heart_smart_au.marketing_funnel_stages`
  (run_date, stage, count, synced_at)
VALUES
  ('2026-08-28', 'Optin', 2302, CURRENT_TIMESTAMP()),
  ('2026-08-28', 'Registered GA', 481, CURRENT_TIMESTAMP()),
  ...
```

Replace existing day's records (avoid duplicates)

#### Step 4: Query GHL Contacts for Attribution
Call: `GET /contacts/search?page=1&limit=100`

For each contact, extract:
- `email`
- `attributionSource.utmMedium` (e.g., "paid", "organic")
- `attributionSource.fbclid` (Facebook Click ID)

Insert to `ghl_contacts_cache`:
```sql
INSERT INTO `jv-data-warehouse.heart_smart_au.ghl_contacts_cache`
  (email, contact_id, attribution_source, final_attribution, is_validated, synced_at)
VALUES
  ('user@example.com', 'contact_123', 'paid', 'PAID', true, CURRENT_TIMESTAMP()),
  ...
```

#### Step 5: Export Combined Data
Merge funnel stages + contact attribution into JSON

### Phase 4: Export to JSON

#### Step 1: Query BigQuery
```sql
SELECT 
  date,
  CAST(spend AS STRING) as spend,
  impressions,
  link_clicks,
  leads
FROM `jv-data-warehouse.heart_smart_au.marketing_ad_spend_daily`
ORDER BY date ASC
```

#### Step 2: Generate JSON
```json
{
  "meta": {
    "generatedAt": "2026-08-28T12:00:00.000Z",
    "source": "BigQuery heart_smart_au.marketing_ad_spend_daily (Meta Ads verified)",
    "dataWindow": "Jan 2026 - Aug 2026",
    "syncedAt": "2026-08-28",
    "dataPoints": 213,
    "note": "Heart Smart Australia — Meta Ads daily data"
  },
  "daily": [
    { "date": "2026-08-20", "spend": 500.00, "impressions": 25000, "linkClicks": 250, "leads": 12 },
    ...
  ]
}
```

#### Step 3: Write to File
Path: `heart-smart-dashboard/masterclass-dashboard/data/marketing-performance.json`

Verify file was written and has correct format.

### Phase 5: Git Commit & Push

#### Step 1: Git Status
```bash
cd /Users/jayvee/Documents/ds-work/heart-smart-dashboard
git status
```

Should show:
- `masterclass-dashboard/data/marketing-performance.json` modified

#### Step 2: Git Add
```bash
git add masterclass-dashboard/data/marketing-performance.json
```

#### Step 3: Git Commit
```bash
git commit -m "Sync: Heart Smart Meta Ads data through [DATE]

Meta synced: [START_DATE] to [END_DATE] ([COUNT] records)
Total ad spend: A$[TOTAL].XX

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

#### Step 4: Git Push
```bash
git push origin main
```

Verify push succeeded.

### Phase 6: Report Summary

Display to user:
```
╔═══════════════════════════════════════════════════════════════╗
║     SYNC COMPLETE: Heart Smart Marketing Data                ║
╚═══════════════════════════════════════════════════════════════╝

✅ META ADS SYNCED
   Date range: [START] to [END]
   Records synced: [N] new, [M] skipped (duplicates)
   Total spend: A$[TOTAL].XX
   Impressions: [TOTAL_IMPR]
   Link clicks: [TOTAL_CLICKS]
   Leads: [TOTAL_LEADS]

✅ EXPORTED
   File: marketing-performance.json
   Total records: [COUNT]
   Date range: [MIN] to [MAX]

✅ DEPLOYED
   Commit: [HASH]
   Pushed to: jayr-ai/heart-smart-dashboard (main)

📊 Dashboard will auto-refresh on next page load
```

## Error Handling

### Meta MCP Errors
- If account not queryable: Stop, report error
- If no data for date range: Continue with available data
- If API rate limit: Retry with backoff

### BigQuery Errors
- If insert fails: Check for constraint violations
- If table doesn't exist: Report and stop
- If permission denied: Check credentials

### GitHub Errors
- If push fails: Check branch, pull, retry
- If auth fails: Report and stop

## Flags & Modifiers

| Flag | Effect | Example |
|------|--------|---------|
| `--meta-since DATE` | Sync from DATE to today | `--meta-since 2026-08-13` |
| `--meta-days N` | Sync last N days | `--meta-days 7` |
| `--no-push` | Update BigQuery/JSON, no GitHub | Standalone |
| `--dry-run` | Show what would sync, don't execute | Standalone |

## Testing

Run with `--dry-run` first to verify:
1. Date range detection works
2. Meta API returns data
3. BigQuery tables exist
4. JSON export format is correct

Then run without `--dry-run` to execute.

## Success Criteria

✅ All steps complete
✅ BigQuery table updated
✅ marketing-performance.json exported
✅ GitHub commit pushed
✅ No errors in output
✅ User report shows all metrics
