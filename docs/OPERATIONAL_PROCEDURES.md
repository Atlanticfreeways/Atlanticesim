# Atlantic eSIM: Operational Procedures & Troubleshooting

## Daily Operations

### Health Verification
```bash
# Check system health
curl https://api.atlanticesim.com/api/v1/health | jq

# Check provider health
curl https://api.atlanticesim.com/api/v1/providers/health | jq

# Check queue status (via health endpoint)
# Look for: queues.activations.waiting < 100
```

### Catalog Sync Verification
- Runs automatically at 03:00 UTC daily
- Check logs for: `Catalog sync complete: X upserted, Y deactivated`
- If sync failed: manually trigger via admin endpoint or restart app

### Usage Sync Verification
- Runs automatically every 6 hours
- Check logs for: `Usage sync complete: X synced, Y errors`
- High error count → check provider API health

## Troubleshooting

### Orders Stuck in PENDING/PROCESSING

```bash
# 1. Check activation queue
curl https://api.atlanticesim.com/api/v1/health | jq '.queues'

# 2. Check for failed jobs in Bull dashboard
# Navigate to /admin/queues (if Bull Board enabled)

# 3. Check Redis connectivity
redis-cli -u $REDIS_URL ping

# 4. Retry stuck jobs
# Jobs auto-retry 3x with exponential backoff
# If still stuck after retries, check provider API status
```

### Provider API Failures

```bash
# 1. Check which providers are down
curl https://api.atlanticesim.com/api/v1/providers/health | jq

# 2. Circuit breaker states
# OPEN = provider disabled (auto-recovers after 30s)
# HALF-OPEN = testing recovery
# CLOSED = healthy

# 3. If provider permanently down:
# The ProviderRouterService auto-routes to healthy alternatives
# Orders with fallback chain will try alternate providers

# 4. Re-enable a disabled provider
# Provider auto-re-enables when health check passes
# Or manually: UPDATE providers SET "isActive" = true WHERE slug = '<provider>';
```

### Database Issues

```bash
# Check connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'atlantic_esim';

# Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### High Memory / CPU

1. Check if catalog sync or usage sync is running (resource-intensive)
2. Check queue depth — large backlog = high CPU
3. Check for memory leaks: monitor RSS over time
4. Scale horizontally: increase ECS desired count
5. Auto-scaling triggers at 70% CPU

### Search Returns No Results

1. Check if catalog sync has run: `SELECT COUNT(*) FROM packages WHERE "isActive" = true;`
2. If DB empty → trigger manual sync or check provider health
3. Live fallback should kick in automatically when DB is empty
4. Check cache: stale cache may return empty results → wait 5 min TTL

## Maintenance Windows

- **Catalog Sync:** 03:00 UTC daily (automated)
- **Usage Sync:** Every 6 hours (automated)
- **DB Migrations:** Apply during low-traffic (02:00-04:00 UTC)
- **Deployments:** Anytime via blue-green (zero downtime)

## Key Metrics to Watch

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| API p95 response time | < 500ms | 500ms-2s | > 2s |
| Error rate | < 0.1% | 0.1-1% | > 1% |
| Queue waiting | < 50 | 50-500 | > 500 |
| DB connections | < 50% pool | 50-80% | > 80% |
| Provider health | 5-6 healthy | 3-4 healthy | < 3 healthy |
| Disk usage | < 60% | 60-80% | > 80% |
