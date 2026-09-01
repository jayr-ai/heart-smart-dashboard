# Heart Smart Revenue Export Setup

This document describes how to set up and execute the Heart Smart revenue data export to generate the `cash-attribution.json` file for the Masterclass Dashboard.

## Overview

The revenue export system pulls Heart Smart transaction data from BigQuery and generates a JSON file that powers the revenue analytics on the Masterclass Dashboard. Data includes:

- **1,840+ transaction records** (as of Sep 1, 2026)
- **$1.28M AUD total revenue**
- **Attribution breakdown**: PAID vs ORGANIC source
- **Daily and monthly aggregations**

## Method 1: Apps Script (Recommended for Automated Syncs)

The Apps Script function `exportCashAttributionData()` is now available in `apps-script-v2-data-sync.gs` and provides a reusable export pipeline that can be triggered daily.

### Setup Steps

1. **Open the Google Sheet Apps Script Editor**
   - Navigate to: Google Sheet > Extensions > Apps Script
   - Paste the content from `apps-script-v2-data-sync.gs`

2. **Set GitHub Token** (One-Time)
   - In the Apps Script editor, run:
   ```javascript
   setGitHubToken("your_github_token_here")
   ```
   - Use a Personal Access Token with `repo` scope from https://github.com/settings/tokens

3. **Test the Export**
   - In the Apps Script editor, click Run > `exportCashAttributionData`
   - Watch the Execution log for progress and errors
   - Expected output: "✅ Cash attribution export completed (XXXs)"

4. **Set Up Daily Trigger (Optional)**
   - In Apps Script, go to Triggers
   - Create new trigger for `exportCashAttributionData`
   - Frequency: Daily at 6 AM AEST

### Function Details

**Function:** `exportCashAttributionData()`

**What it does:**
1. Queries `jv-data-warehouse.heart_smart_au.revenue_transactions_enriched` table
2. Calculates monthly summaries with PAID/ORGANIC attribution
3. Calculates daily breakdown aggregations
4. Transforms raw transactions to dashboard format
5. Exports JSON to GitHub at `masterclass-dashboard/data/cash-attribution.json`
6. Commits with descriptive message including transaction count and total revenue

**Expected output:**
```
🔄 Starting Heart Smart cash attribution export...
📊 Step 1: Fetching revenue transactions from BigQuery...
   ✓ Fetched 1840 transactions
📊 Step 2: Calculating monthly summary...
   ✓ Calculated 11 months
📊 Step 3: Calculating daily breakdown...
   ✓ Calculated 245 days
✅ Cash attribution export completed (12s)
   - 1840 transactions
   - $1284167.35 AUD total
   - 11 months
   - 245 days
```

## Method 2: Node.js Script (For Development/Testing)

An alternative Node.js script is available for standalone execution.

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install --save @google-cloud/bigquery
   ```

2. **Authenticate**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json
   export GITHUB_TOKEN="your_github_token_here"
   ```

3. **Run Export**
   ```bash
   node export-revenue-data.js
   ```

### Expected Output
```
Heart Smart Revenue Export
==================================================
Fetching revenue transactions from BigQuery...
  Found 1840 transactions
Calculating monthly summary...
  Calculated 11 months
Calculating daily breakdown...
  Calculated 245 days
Transforming transactions...
Building JSON export...
Saving to ./masterclass-dashboard/data/cash-attribution.json...
✅ Local export complete (2847523 bytes)
Exporting to GitHub...
  ✅ Pushed to GitHub (abc1234)

Summary:
  Transactions: 1840
  Total Revenue: $1284167.35 AUD
  Months: 11
  Days: 245

✅ Export complete!
```

## JSON Output Format

The generated `cash-attribution.json` file contains:

```json
{
  "meta": {
    "generatedAt": "2026-09-01T13:45:30.123Z",
    "source": "BigQuery revenue_transactions_enriched table with Heart Smart products",
    "dataWindow": "Nov 2025 - Sep 2026",
    "totalRecords": 1840,
    "totalRevenue": 1284167.35,
    "currency": "AUD"
  },
  "monthlySummary": [
    {
      "month": "2025-11",
      "transactionCount": 2,
      "totalCash": 19697,
      "cashFromAds": 0,
      "cashFromOrganic": 19697
    },
    // ... more months
  ],
  "dailyBreakdown": [
    {
      "date": "2025-11-01",
      "cashFromAds": 0,
      "cashFromOrganic": 1000
    },
    // ... more days
  ],
  "transactions": [
    {
      "date": "2026-09-01",
      "name": "Sample Customer",
      "email": "customer@example.com",
      "product": "Intensive Workshop",
      "amount": 500,
      "source": "Paid"
    },
    // ... 1840 total transactions
  ]
}
```

## Data Validation

After export, verify the JSON contains:

1. **Heart Smart Products Only**
   - Products should include: "Intensive", "Workshop", "Masterclass", etc.
   - NOT Freedom Academy products (no "Accelerator", "Freedom Coach", etc.)

2. **Attribution Distribution**
   - PAID: ~60-70% of revenue (from Meta Ads)
   - ORGANIC: ~30-40% of revenue (organic sources)

3. **Recent Data**
   - Latest transaction date should be today or yesterday
   - Monthly summary should include current month

## Troubleshooting

### "GitHub export failed"
- Check that `GITHUB_TOKEN` is set and has `repo` scope
- Verify token is not expired: https://github.com/settings/tokens

### BigQuery Query Timeout
- Wait a few moments and retry
- Check if there are large data exports happening in parallel
- Apps Script timeout is 5 minutes; if exceeded, increase `deadline` in `executeAndReturnRows()`

### Wrong Data (FA Instead of Heart Smart)
- Verify the query uses `heart_smart_au` dataset, NOT `freedom_academy_au`
- Check that BigQuery table `revenue_transactions_enriched` exists
- Verify Heart Smart products in the table

### File Doesn't Update
- Check GitHub CDN cache: wait 5-15 minutes for cache refresh
- Verify commit was pushed to `main` branch
- Check GitHub Actions are passing (if applicable)

## Monitoring

To monitor export health:

1. **Check Recent Commits**
   - Go to https://github.com/jayr-ai/heart-smart-dashboard/commits/main
   - Look for "Update Heart Smart revenue attribution data" commits
   - Commit message includes transaction count and total revenue

2. **Verify File Freshness**
   - Check `masterclass-dashboard/data/cash-attribution.json`
   - Look at `meta.generatedAt` timestamp
   - Should be within last 24 hours

3. **Check Dashboard Display**
   - Visit Masterclass Dashboard at https://datahub.heartsmartaustralia.com.au/masterclass-dashboard
   - Verify cash attribution cards show current data
   - Check monthly summary totals match BigQuery

## Next Steps

1. **Test Export:** Run the Apps Script function once
2. **Verify Output:** Check GitHub for new commit
3. **Set Up Trigger:** Schedule daily export if needed
4. **Monitor:** Check dashboard loads with fresh data

## Files

- `apps-script-v2-data-sync.gs` - Apps Script with export function
- `export-revenue-data.js` - Node.js alternative export script
- `masterclass-dashboard/data/cash-attribution.json` - Output file (generated)
- `REVENUE_EXPORT_SETUP.md` - This documentation

## Questions?

Refer to the memory file: `FA-MARKETING-DASHBOARD-PERFECT-STATE-2026-09-01.md` for production state reference.
