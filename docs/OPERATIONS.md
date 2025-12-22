# Public API Navigator - Operations Guide

## Overview

This document provides operational guidance for running and maintaining the Public API Navigator platform.

---

## System Architecture

```
Frontend (Next.js 15)     Backend (Payload CMS)     Database
     |                           |                      |
     +----- API Requests ------->|                      |
     |                           +----- Queries ------->|
     |<---- JSON Response -------|                      |
     |                           |                      |
     |                    [Jobs] |                      |
     |                     sync  |                      |
     |                    health |                      |
     |                    enrich |                      |
     |                      seo  |                      |
     |                screenshot |                      |
```

---

## Batch Job Operations

### 1. SEO Metadata Extraction

**Purpose**: Extract SEO metadata from API documentation pages.

**Script Location**: `/apps/backend/scripts/batch-seo-extract.mjs`

**Usage**:
```bash
# Run with defaults (40 batches, 50 APIs per batch)
node scripts/batch-seo-extract.mjs

# Custom batch count
node scripts/batch-seo-extract.mjs --batches=100

# Force re-extraction for all APIs
node scripts/batch-seo-extract.mjs --force

# Dry run (check status only)
node scripts/batch-seo-extract.mjs --dry-run

# Custom batch size and delay
node scripts/batch-seo-extract.mjs --batch-size=100 --delay=20000
```

**Progress Tracking**: Progress is saved to `/apps/backend/data/seo-extract-progress.json`

### 2. AI Enrichment

**Purpose**: Generate AI-powered summaries and blog posts for APIs.

**Script Location**: `/apps/backend/scripts/batch-enrich.mjs`

**Usage**:
```bash
# Run with defaults (20 batches, 1 minute delay)
node scripts/batch-enrich.mjs

# Custom settings
node scripts/batch-enrich.mjs --batches=50 --delay=30000

# Dry run
node scripts/batch-enrich.mjs --dry-run

# Verbose output
node scripts/batch-enrich.mjs --verbose
```

**Progress Tracking**: Progress is saved to `/apps/backend/data/enrich-progress.json`

**Environment Variables Required**:
```env
ENRICH_AI_ENABLED=true
ENRICH_AI_API_KEY=sk-xxx
ENRICH_AI_MODEL=gpt-4o-mini
ENRICH_AI_ARTICLE_ENABLED=true
```

### 3. Health Checks

**Purpose**: Monitor API availability and latency.

**Triggered by**: Scheduler (`/apps/backend/scripts/scheduler.mjs`)

**Manual Trigger**:
```bash
curl -X POST http://localhost:3001/api/admin/health \
  -H "Authorization: Bearer $JOB_TOKEN"
```

### 4. Screenshots

**Purpose**: Capture screenshots of API documentation pages.

**Manual Trigger**:
```bash
curl -X POST http://localhost:3001/api/admin/screenshot \
  -H "Authorization: Bearer $JOB_TOKEN"
```

---

## Data Quality Verification

### Running Quality Check

```bash
node scripts/verify-data-quality.mjs
```

**Output Example**:
```
============================================================
          DATA QUALITY VERIFICATION REPORT
============================================================

OVERVIEW
----------------------------------------
Total APIs:      1450
Active APIs:     1423
Archived APIs:   27
Categories:      47

HEALTH STATUS
----------------------------------------
Healthy (live):  1180 (82.9%)
Slow:            120 (8.4%)
Down:            89 (6.3%)
Unknown:         34 (2.4%)

ENRICHMENT COVERAGE
----------------------------------------
SEO Metadata    [========================= ] 85.2% (1213)
AI Analysis     [=====================     ] 72.1% (1026)
Screenshots     [=======================   ] 78.5% (1117)
OpenAPI Spec    [=======                   ] 25.3% (360)
Blog Posts      [==================        ] 65.2% (928)

QUALITY SCORES
----------------------------------------
SEO Quality:     85%
AI Coverage:     72%
Health Score:    83%
Overall Score:   80%

============================================================
OVERALL GRADE: B (80%)
============================================================
```

---

## Admin API Endpoints

All admin endpoints require Bearer token authentication:
```
Authorization: Bearer $JOB_TOKEN
```

### Stats
```bash
GET /api/admin/stats
```

### SEO Extraction
```bash
# Get status
GET /api/admin/seo-extract

# Run extraction
POST /api/admin/seo-extract
Content-Type: application/json

{
  "batchSize": 50,
  "force": false,
  "apiIds": [1, 2, 3]  // Optional: specific APIs only
}
```

### AI Enrichment
```bash
POST /api/admin/enrich
```

### Health Check
```bash
POST /api/admin/health
```

### Screenshot
```bash
POST /api/admin/screenshot
```

### Sync
```bash
POST /api/admin/sync
```

---

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Health Check Coverage**: Percentage of APIs with recent health checks
2. **SEO Coverage**: Percentage of APIs with SEO metadata
3. **AI Coverage**: Percentage of APIs with AI analysis
4. **Error Rate**: Number of failed jobs per hour
5. **Average Latency**: Mean response time for health checks

### Database Queries

**Check job run history**:
```sql
SELECT jobName, status, startedAt, durationMs, stats
FROM jobRuns
ORDER BY startedAt DESC
LIMIT 20;
```

**Find APIs missing SEO data**:
```sql
SELECT id, name, link
FROM apis
WHERE syncStatus = 'active'
  AND (seoMetadata IS NULL OR seoMetadata->>'extractedAt' IS NULL);
```

**Find APIs missing AI analysis**:
```sql
SELECT id, name, link
FROM apis
WHERE syncStatus = 'active'
  AND healthStatus IN ('live', 'slow')
  AND (aiAnalysis IS NULL OR aiAnalysis->>'summary' IS NULL);
```

---

## Troubleshooting Guide

### Issue: SEO extraction failing for specific APIs

**Symptoms**: Job reports high failure count

**Diagnosis**:
1. Check if API is accessible: `curl -I <api-url>`
2. Check for SSRF blocks in logs
3. Verify content-type is HTML

**Resolution**:
- If API is down, wait for it to recover
- If blocked by SSRF, add to allowlist in env: `HEALTH_SSRF_ALLOW_CIDRS`

### Issue: AI enrichment producing low-quality content

**Symptoms**: Summaries are generic or too short

**Diagnosis**:
1. Check AI API response logs
2. Verify API key is valid
3. Check rate limits

**Resolution**:
- Quality validation now rejects summaries < 20 chars
- Increase temperature slightly (currently 0.2)
- Ensure API homepage is accessible for context

### Issue: Screenshots not loading

**Symptoms**: Placeholder shown instead of screenshots

**Diagnosis**:
1. Check R2/CDN availability
2. Verify screenshot job is running
3. Check browser console for CORS errors

**Resolution**:
- Verify CDN URL in env: `SCREENSHOT_CDN_URL`
- Check screenshot job logs
- Ensure rewrite rules are correct

### Issue: Sitemap not updating

**Symptoms**: New APIs not appearing in sitemap

**Diagnosis**:
1. Check sitemap cache
2. Verify CMS is accessible during build

**Resolution**:
- Clear Next.js cache: `rm -rf .next/cache`
- Rebuild: `pnpm build`

---

## Environment Variables Reference

### Required
```env
JOB_TOKEN=<secure-token>
DATABASE_URL=postgres://...
```

### AI Enrichment
```env
ENRICH_AI_ENABLED=true
ENRICH_AI_API_KEY=sk-xxx
ENRICH_AI_BASE_URL=https://api.openai.com/v1
ENRICH_AI_MODEL=gpt-4o-mini
ENRICH_AI_MAX_PER_RUN=10
ENRICH_AI_ARTICLE_ENABLED=true
ENRICH_AI_ARTICLE_MODEL=gpt-4o-mini
ENRICH_AI_ARTICLE_MAX_PER_RUN=10
```

### Health Checks
```env
HEALTH_CONCURRENCY=10
HEALTH_TIMEOUT_MS=10000
HEALTH_BATCH_SIZE=200
HEALTH_USER_AGENT=Mozilla/5.0 (compatible; ApiNavigatorBot/1.0)
```

### Screenshots
```env
SCREENSHOT_CDN_URL=https://screenshots.api-navigator.com
SCREENSHOT_BATCH_SIZE=50
SCREENSHOT_CONCURRENCY=3
```

### Frontend
```env
NEXT_PUBLIC_CMS_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://public-api.org
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx
```

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse Performance | > 90 | TBD |
| Lighthouse SEO | > 95 | TBD |
| LCP (Largest Contentful Paint) | < 2.5s | TBD |
| FID (First Input Delay) | < 100ms | TBD |
| CLS (Cumulative Layout Shift) | < 0.1 | TBD |
| API Response Time | < 500ms | TBD |

### Running Lighthouse

```bash
# Install lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://public-api.org --output json --output-path ./lighthouse-report.json

# View HTML report
lighthouse https://public-api.org --output html --view
```

---

## Backup and Recovery

### Database Backup

```bash
pg_dump -Fc $DATABASE_URL > backup_$(date +%Y%m%d).dump
```

### Database Restore

```bash
pg_restore -d $DATABASE_URL backup_20241222.dump
```

### Screenshot Backup

Screenshots are stored in Cloudflare R2. Use `rclone` for backup:

```bash
rclone sync r2:screenshots ./backup/screenshots
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Run `pnpm lint` - no errors
- [ ] Run `pnpm typecheck` - no errors
- [ ] Run `pnpm build` - successful build
- [ ] Verify environment variables are set
- [ ] Run data quality verification
- [ ] Check sitemap generation
- [ ] Verify robots.txt accessibility
- [ ] Test critical user flows

---

## Contact and Support

For issues or questions, check:
1. Job run logs in database
2. Application logs
3. GitHub issues

