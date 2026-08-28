# Sync Heart Smart Marketing Data

**Status**: ✅ READY (Meta Ads only; GHL integration pending)

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
| **GHL Pipeline** | TBD (awaiting configuration) |

## Deployment

Currently deployed to GitHub Pages:
- **URL**: `datahub.heartsmartaustralia.com.au/masterclass-dashboard/`
- **Repo**: `jayr-ai/heart-smart-dashboard`
- **Folder**: `masterclass-dashboard/`

## Next Steps

1. **First Sync**: Run `/sync-heart-smart-marketing-data` to pull initial Meta data
2. **GHL Configuration**: Once Heart Smart's masterclass pipeline ID is available, wire up funnel stages export
3. **Validation**: Run `/validate-ghl-attribution` (or Heart Smart variant) for contact attribution once GHL is configured
4. **Scheduled Runs**: Set up daily 6 AM AEST trigger via Apps Script

## Support

See `IMPLEMENTATION.md` for detailed execution flow and error handling.
