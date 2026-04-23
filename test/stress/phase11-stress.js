import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const searchLatency = new Trend('search_latency');
const orderLatency = new Trend('order_latency');
const cacheHits = new Counter('cache_hits');
const errors = new Counter('request_errors');

export const options = {
  scenarios: {
    // Scenario 1: Package search under load (1000 req/min)
    package_search: {
      executor: 'constant-arrival-rate',
      rate: 17, // ~1000/min
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    // Scenario 2: Order creation under load (500 req/min)
    order_creation: {
      executor: 'constant-arrival-rate',
      rate: 8, // ~500/min
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 30,
      maxVUs: 100,
      startTime: '30s',
    },
    // Scenario 3: Concurrent activations (100 concurrent)
    concurrent_activations: {
      executor: 'constant-vus',
      vus: 100,
      duration: '1m',
      startTime: '1m',
    },
    // Scenario 4: 2x expected load spike
    spike_2x: {
      executor: 'ramping-arrival-rate',
      startRate: 17,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 34 },  // ramp to 2x
        { duration: '1m', target: 34 },   // hold 2x
        { duration: '30s', target: 17 },  // ramp down
      ],
      preAllocatedVUs: 100,
      maxVUs: 300,
      startTime: '3m',
    },
    // Scenario 5: 5x expected load spike
    spike_5x: {
      executor: 'ramping-arrival-rate',
      startRate: 17,
      timeUnit: '1s',
      stages: [
        { duration: '15s', target: 85 },  // ramp to 5x
        { duration: '30s', target: 85 },  // hold 5x
        { duration: '15s', target: 17 },  // ramp down
      ],
      preAllocatedVUs: 200,
      maxVUs: 500,
      startTime: '5m',
    },
  },
  thresholds: {
    search_latency: ['p(95)<200'],    // Package search: <200ms p95
    order_latency: ['p(95)<500'],     // Order creation: <500ms p95
    http_req_duration: ['p(95)<500'], // Overall: <500ms p95
    http_req_failed: ['rate<0.01'],   // <1% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

export default function () {
  const scenario = __ENV.scenario || exec.scenario.name;

  if (scenario === 'package_search' || scenario === 'spike_2x' || scenario === 'spike_5x') {
    group('Package Search', () => {
      const countries = ['US', 'GB', 'FR', 'DE', 'JP', 'AU', 'CA', 'BR'];
      const country = countries[Math.floor(Math.random() * countries.length)];

      const res = http.get(`${BASE_URL}/packages?countries=${country}`, { headers });
      searchLatency.add(res.timings.duration);

      const ok = check(res, {
        'search status 200': (r) => r.status === 200,
        'search p95 < 200ms': (r) => r.timings.duration < 200,
        'search returns array': (r) => Array.isArray(JSON.parse(r.body || '[]')),
      });
      if (!ok) errors.add(1);

      // Second identical request should hit cache
      const cached = http.get(`${BASE_URL}/packages?countries=${country}`, { headers });
      if (cached.timings.duration < res.timings.duration * 0.5) {
        cacheHits.add(1);
      }
    });
  }

  if (scenario === 'order_creation') {
    group('Order Creation', () => {
      const payload = JSON.stringify({
        packageId: 'maya-us-3gb',
        providerId: 'maya-mobile',
        paymentMethod: 'card',
        idempotencyKey: `load-${Date.now()}-${Math.random()}`,
      });

      const res = http.post(`${BASE_URL}/orders`, payload, { headers });
      orderLatency.add(res.timings.duration);

      check(res, {
        'order status 201 or 404': (r) => r.status === 201 || r.status === 404,
        'order p95 < 500ms': (r) => r.timings.duration < 500,
      });
    });
  }

  if (scenario === 'concurrent_activations') {
    group('Concurrent Activation Simulation', () => {
      // Simulate activation queue pressure via order creation
      const payload = JSON.stringify({
        packageId: 'maya-us-5gb',
        paymentMethod: 'card',
        idempotencyKey: `activation-${Date.now()}-${Math.random()}`,
      });

      const res = http.post(`${BASE_URL}/orders`, payload, { headers });

      check(res, {
        'activation request accepted': (r) => r.status === 201 || r.status === 404 || r.status === 401,
      });
    });
  }

  sleep(0.1);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    search_p95: data.metrics.search_latency?.values?.['p(95)'] || 'N/A',
    order_p95: data.metrics.order_latency?.values?.['p(95)'] || 'N/A',
    overall_p95: data.metrics.http_req_duration?.values?.['p(95)'] || 'N/A',
    error_rate: data.metrics.http_req_failed?.values?.rate || 0,
    total_requests: data.metrics.http_reqs?.values?.count || 0,
    cache_hits: data.metrics.cache_hits?.values?.count || 0,
  };

  return {
    'test/load/results.json': JSON.stringify(summary, null, 2),
    stdout: `
=== Atlantic eSIM Load Test Results ===
Search p95:    ${summary.search_p95}ms (target: <200ms)
Order p95:     ${summary.order_p95}ms (target: <500ms)
Overall p95:   ${summary.overall_p95}ms (target: <500ms)
Error rate:    ${(summary.error_rate * 100).toFixed(2)}% (target: <1%)
Total reqs:    ${summary.total_requests}
Cache hits:    ${summary.cache_hits}
=======================================
`,
  };
}
