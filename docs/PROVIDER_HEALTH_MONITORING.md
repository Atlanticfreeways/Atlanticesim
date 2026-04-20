# Provider Health Monitoring System

## Overview

The Atlantic eSIM Platform now includes a comprehensive **Provider Health Monitoring System** that ensures the application remains stable and functional even when individual provider APIs are unavailable or misconfigured.

## Key Features

### 1. **Background Health Checks**
- Automated health checks run **every minute** for all registered provider adapters
- Each check has a **5-second timeout** to prevent hanging
- Tracks consecutive failures and response times

### 2. **Intelligent Provider Selection**
- Package searches automatically use **only healthy providers**
- Unhealthy providers are excluded to prevent cascading failures
- Fallback mechanism tries all providers if none are marked healthy

### 3. **Auto-Disable Mechanism**
- Providers that fail **5 consecutive health checks** are automatically disabled in the database
- Prevents continuous attempts to use broken providers
- Can be manually re-enabled once issues are resolved

### 4. **Graceful Degradation**
- Application continues functioning with **at least one healthy provider**
- Failed provider requests don't block successful ones
- User experience remains smooth even with partial provider outages

## Architecture

### Components

1. **`ProviderHealthService`**
   - Core health monitoring service
   - Runs scheduled background checks
   - Maintains health status map for all providers
   - Auto-disables consistently failing providers

2. **`ProvidersService` (Enhanced)**
   - Filters providers by health status before searches
   - Implements timeout protection (15s per provider)
   - Provides fallback search mechanism

3. **`ProviderHealthController`**
   - REST API endpoints for health monitoring
   - Allows manual health checks
   - Exposes real-time status information

4. **`BaseProviderAdapter` (Enhanced)**
   - Improved `checkHealth()` with timeout handling
   - Better error categorization (connection refused, timeout, auth failure, etc.)
   - Accepts non-5xx responses as "alive"

## API Endpoints

### Get All Provider Health Status
```http
GET /api/v1/providers/health
```

**Response:**
```json
{
  "timestamp": "2026-01-14T17:00:00.000Z",
  "providers": [
    {
      "providerId": "airalo",
      "providerName": "Airalo",
      "isHealthy": false,
      "lastCheck": "2026-01-14T17:00:00.000Z",
      "consecutiveFailures": 2,
      "error": "Authentication failed - check API credentials"
    },
    {
      "providerId": "esim-go",
      "providerName": "eSIM Go",
      "isHealthy": true,
      "lastCheck": "2026-01-14T17:00:00.000Z",
      "lastSuccess": "2026-01-14T17:00:00.000Z",
      "consecutiveFailures": 0,
      "health": {
        "isAvailable": true,
        "responseTime": 234,
        "provider": "eSIM Go"
      }
    }
  ]
}
```

### Get Specific Provider Health
```http
GET /api/v1/providers/health/:providerId
```

### Manually Trigger Health Check
```http
GET /api/v1/providers/health/:providerId/check
```

## Configuration

### Health Check Settings
Located in `ProviderHealthService`:

```typescript
private readonly MAX_CONSECUTIVE_FAILURES = 3;
private readonly HEALTH_CHECK_INTERVAL_MS = 60000; // 1 minute
private readonly DISABLE_THRESHOLD = 5; // Auto-disable after 5 failures
```

### Timeout Settings
- **Health check timeout**: 5 seconds
- **Package search timeout**: 15 seconds per provider
- **Overall health check**: 10 seconds (with Promise.race)

## Behavior Examples

### Scenario 1: All Providers Healthy
```
✅ Airalo: Healthy (response: 234ms)
✅ eSIM Go: Healthy (response: 156ms)
✅ Maya Mobile: Healthy (response: 412ms)

→ Search uses all 3 providers
→ Results aggregated from all sources
```

### Scenario 2: One Provider Down
```
❌ Airalo: Unhealthy (Authentication failed)
✅ eSIM Go: Healthy (response: 156ms)
✅ Maya Mobile: Healthy (response: 412ms)

→ Search uses only eSIM Go and Maya Mobile
→ Airalo excluded automatically
→ No impact on user experience
```

### Scenario 3: All Providers Down
```
❌ Airalo: Unhealthy (Connection refused)
❌ eSIM Go: Unhealthy (Timeout)
❌ Maya Mobile: Unhealthy (Server error: 503)

→ Fallback: Attempts all providers anyway (last resort)
→ Returns empty results if all fail
→ Logs warning for monitoring
```

### Scenario 4: Provider Auto-Disabled
```
❌ Airalo: 5 consecutive failures
🚨 Provider 'airalo' has been DISABLED in database

→ Provider removed from active rotation
→ Manual intervention required to re-enable
→ Prevents wasted API calls
```

## Logging

The system provides detailed logging at multiple levels:

### Info Level
```
[ProvidersService] All provider adapters registered with health monitoring
[ProviderHealthService] Health check complete: 2/3 providers healthy
[ProvidersService] Retrieved 45 packages from 2 providers
```

### Warning Level
```
[ProviderHealthService] Provider Airalo (airalo) status changed: ❌ DEGRADED
[ProvidersService] ⚠️  No healthy providers available for search
[BaseProviderAdapter] Health check failed for Airalo: Authentication failed
```

### Error Level
```
[ProviderHealthService] 🚨 Provider airalo has been DISABLED due to: 5 consecutive health check failures
```

## Testing

### Manual Health Check
```bash
# Check all providers
curl http://localhost:3000/api/v1/providers/health

# Check specific provider
curl http://localhost:3000/api/v1/providers/health/airalo

# Trigger manual check
curl http://localhost:3000/api/v1/providers/health/esim-go/check
```

### Monitoring Logs
```bash
# Watch health check logs
npm run start:dev | grep "Health check"

# Watch provider status changes
npm run start:dev | grep "status changed"
```

## Benefits

1. **Zero Downtime**: Application remains functional with partial provider availability
2. **Automatic Recovery**: Providers automatically marked healthy when they recover
3. **Resource Efficiency**: Stops wasting API calls on broken providers
4. **Better UX**: Users get results from healthy providers without delays
5. **Operational Visibility**: Real-time health status via API endpoints
6. **Proactive Alerts**: Status change logs enable monitoring integration

## Next Steps

1. **Alerting Integration**: Connect to Slack/PagerDuty for critical failures
2. **Metrics Dashboard**: Visualize provider health over time
3. **Circuit Breaker**: Implement exponential backoff for failed providers
4. **Health Check Customization**: Provider-specific health check endpoints
5. **Database Persistence**: Store health history for analytics
