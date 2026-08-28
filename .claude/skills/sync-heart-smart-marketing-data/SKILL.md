---
name: sync-heart-smart-marketing-data
description: Pulls latest Meta Ads data for Heart Smart Australia and exports to dashboard JSON
---

# Sync Heart Smart Marketing Data

Pulls the latest ad spend data from **Meta Ads MCP** (Heart Smart AU account), updates BigQuery tables, and exports to the Heart Smart Marketing dashboard JSON file.

## Usage

```bash
/sync-heart-smart-marketing-data
```

Or with options:

```bash
/sync-heart-smart-marketing-data --meta-since 2026-08-13      # Sync Meta data from Aug 13 onward
/sync-heart-smart-marketing-data --meta-days 7                 # Sync last 7 days of Meta data
/sync-heart-smart-marketing-data --no-push                     # Update BigQuery/JSON but don't push to GitHub
/sync-heart-smart-marketing-data --dry-run                     # Preview without executing
```

## What It Does

1. **Meta Ads Sync** (Account: Heart Smart Australia `act_510603536638743`)
   - Pulls daily spend, impressions, link clicks, leads from Meta Ads API
   - Detects missing date ranges and backfills automatically
   - Updates `heart_smart_au.marketing_ad_spend_daily` table (upsert, no duplicates)

2. **Export & Deploy**
   - Generates `marketing-performance.json` from BigQuery
   - Commits and pushes to GitHub
   - Dashboard auto-refreshes on next load

3. **GHL Pipeline Sync** ✅ **ACTIVE**
   - Queries GHL API (Heart Smart account) for pipeline stages
   - Updates `heart_smart_au.marketing_funnel_stages` table (real funnel counts)
   - Queries GHL contacts for attribution classification
   - Updates `heart_smart_au.ghl_contacts_cache` table (PAID/ORGANIC)

## Output

Shows a detailed sync report:
- Dates synced from Meta
- New records inserted/updated in BigQuery
- Files committed to GitHub

## Notes

- Default behavior: auto-detects missing dates (fills forward to TODAY, not backward)
- Uses Meta MCP tool (requires authentication)
- Upsert logic prevents duplicate dates in BigQuery
- Safe to run multiple times (idempotent)
- GHL integration on hold until pipeline ID provided

## Data Sources

- **Meta Ads Account**: Heart Smart AU (`act_510603536638743`, currency AUD)
- **BigQuery Dataset**: `heart_smart_au`
- **Tables**:
  - `marketing_ad_spend_daily` — Daily ad spend, impressions, clicks, leads
  - `marketing_funnel_stages` — GHL pipeline stages (placeholder)
- **GitHub**: `jayr-ai/heart-smart-dashboard` repo, `masterclass-dashboard/data/`

## Recommended Schedule

- Daily at **6 AM AEST** via Apps Script time-driven trigger
- Or manual: `/sync-heart-smart-marketing-data` after business day closes
