import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '5s', target: 20 }, // Ramp up to 20 users
        { duration: '10s', target: 50 }, // Ramp up to 50 users
        { duration: '10s', target: 50 }, // Stay at 50 users
        { duration: '5s', target: 0 },  // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

const BASE_URL = 'http://localhost:3000/api/v1';

export default function () {
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.get(`${BASE_URL}/packages?countries=US`, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
