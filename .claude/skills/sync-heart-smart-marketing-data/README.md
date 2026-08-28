# Sync Heart Smart Marketing Data

**Status**: ✅ FULLY CONFIGURED (Meta Ads + GHL Pipeline + Contact Attribution)

Auto-sync Meta Ads data for Heart Smart Australia into BigQuery and export to the masterclass dashboard.

## Quick Start

```bash
/sync-heart-smart-marketing-data
```

This will:
1. Pull latest Meta Ads data (account `act_510603536638743`)
2. Update BigQuery `heart_smart_au.marketing_ad_spend_daily`
3. Export `marketing-performance.json`
4. Commit & push to GitHub

**Time**: ~2-3 minutes

## What's Different from Freedom Academy?

| Aspect | Value |
|--------|-------|
| **Account ID** | `510603536638743` (Heart Smart AU, AUD currency) |
| **BigQuery Dataset** | `heart_smart_au.*` (separate from Freedom Academy) |
| **Color Scheme** | Red #FF5757 (vs green #20d020) |
| **Domain** | `datahub.heartsmartaustralia.com.au/masterclass-dashboard` |
| **Repo** | `jayr-ai/heart-smart-dashboard` |
| **GHL Pipeline** | ✅ Webinar Pipeline (fVjHZmcsCSemRfeoRBct) |
| **GHL Secrets** | ✅ Configured in GitHub Actions |

## Deployment

Currently deployed to GitHub Pages:
- **URL**: `datahub.heartsmartaustralia.com.au/masterclass-dashboard/`
- **Repo**: `jayr-ai/heart-smart-dashboard`
- **Folder**: `masterclass-dashboard/`

## Next Steps

1. ✅ **GHL Configured**: API key + Location ID + Pipeline ID stored as GitHub Secrets
2. **Run Sync**: `/sync-heart-smart-marketing-data` pulls Meta Ads + GHL Pipeline + Contact Attribution
3. **Verify Data**: Check BigQuery tables + dashboard displays live funnel/attribution
4. **Scheduled Runs**: Set up daily 6 AM AEST trigger via Apps Script or GitHub Actions

## Support

See `IMPLEMENTATION.md` for detailed execution flow and error handling.
