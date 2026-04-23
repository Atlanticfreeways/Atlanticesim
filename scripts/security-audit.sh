#!/bin/bash
# Atlantic eSIM — Security Audit Script
# Covers: OWASP ZAP, Docker scan, SSL/TLS, XSS/CSRF, npm audit
set -e

REPORT_DIR="reports/security"
mkdir -p "$REPORT_DIR"
TARGET_URL="${1:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔒 Atlantic eSIM Security Audit — $(date)"
echo "   Target: $TARGET_URL"
echo "============================================="
echo ""

# 1. npm audit
echo "📦 [1/6] Dependency Audit (npm audit)..."
npm audit --json > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || true
CRITICAL=$(cat "$REPORT_DIR/npm-audit-$TIMESTAMP.json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('critical',0))" 2>/dev/null || echo "?")
HIGH=$(cat "$REPORT_DIR/npm-audit-$TIMESTAMP.json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('high',0))" 2>/dev/null || echo "?")
echo "   Critical: $CRITICAL | High: $HIGH"
echo ""

# 2. Hardcoded secrets scan
echo "🔑 [2/6] Hardcoded Secrets Scan..."
SECRETS_FOUND=$(grep -rn --include="*.ts" --include="*.js" --include="*.json" \
  -E "(password|secret|api_key|apiKey|token)\s*[:=]\s*['\"][A-Za-z0-9+/=]{16,}" \
  src/ --exclude-dir=node_modules 2>/dev/null | grep -v "spec.ts" | grep -v "mock" | grep -v "interface" | grep -v "dto" | wc -l | tr -d ' ')
if [ "$SECRETS_FOUND" -gt 0 ]; then
  echo "   ❌ FOUND $SECRETS_FOUND potential hardcoded secrets!"
  grep -rn --include="*.ts" --include="*.js" \
    -E "(password|secret|api_key|apiKey|token)\s*[:=]\s*['\"][A-Za-z0-9+/=]{16,}" \
    src/ --exclude-dir=node_modules 2>/dev/null | grep -v "spec.ts" | grep -v "mock" > "$REPORT_DIR/secrets-$TIMESTAMP.txt"
else
  echo "   ✅ No hardcoded secrets found"
fi
echo ""

# 3. Security headers check
echo "🛡️  [3/6] Security Headers Validation..."
if command -v curl &> /dev/null; then
  HEADERS=$(curl -sI "$TARGET_URL" 2>/dev/null || echo "UNREACHABLE")
  echo "$HEADERS" > "$REPORT_DIR/headers-$TIMESTAMP.txt"

  check_header() {
    if echo "$HEADERS" | grep -qi "$1"; then
      echo "   ✅ $1 present"
    else
      echo "   ❌ $1 MISSING"
    fi
  }

  check_header "X-Content-Type-Options"
  check_header "X-Frame-Options"
  check_header "Strict-Transport-Security"
  check_header "Content-Security-Policy"
  check_header "X-XSS-Protection"
else
  echo "   ⚠️  curl not available — skipping"
fi
echo ""

# 4. OWASP ZAP scan (if docker available)
echo "🕷️  [4/6] OWASP ZAP Scan..."
if command -v docker &> /dev/null; then
  echo "   Running ZAP baseline scan (this may take 2-5 minutes)..."
  docker run --rm --network host \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk:rw" \
    ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
    -t "$TARGET_URL" \
    -r "zap-report-$TIMESTAMP.html" \
    -J "zap-report-$TIMESTAMP.json" \
    -I 2>/dev/null || echo "   ⚠️  ZAP scan failed or target unreachable"
else
  echo "   ⚠️  Docker not available — skipping ZAP scan"
  echo "   Install Docker and run: docker run ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t $TARGET_URL"
fi
echo ""

# 5. Docker image scan (if trivy available)
echo "🐳 [5/6] Docker Image Scan..."
if command -v trivy &> /dev/null; then
  echo "   Scanning Docker image..."
  docker build -t atlantic-esim:audit . 2>/dev/null
  trivy image --severity HIGH,CRITICAL --format json \
    -o "$REPORT_DIR/trivy-$TIMESTAMP.json" atlantic-esim:audit 2>/dev/null || true
  TRIVY_CRITICAL=$(cat "$REPORT_DIR/trivy-$TIMESTAMP.json" 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin)
c=sum(1 for r in d.get('Results',[]) for v in r.get('Vulnerabilities',[]) if v.get('Severity')=='CRITICAL')
print(c)" 2>/dev/null || echo "?")
  echo "   Critical vulnerabilities in image: $TRIVY_CRITICAL"
elif command -v docker &> /dev/null; then
  echo "   Trivy not installed. Install: brew install trivy"
  echo "   Alternatively: docker run aquasec/trivy image atlantic-esim:latest"
else
  echo "   ⚠️  Docker/Trivy not available — skipping"
fi
echo ""

# 6. SSL/TLS review
echo "🔐 [6/6] SSL/TLS Configuration Review..."
if [[ "$TARGET_URL" == https://* ]] && command -v openssl &> /dev/null; then
  DOMAIN=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
  echo "   Checking $DOMAIN..."
  echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null > "$REPORT_DIR/ssl-$TIMESTAMP.txt" || true
  cat "$REPORT_DIR/ssl-$TIMESTAMP.txt" 2>/dev/null | head -5
  # Check for TLS 1.2+
  TLS12=$(echo | openssl s_client -connect "$DOMAIN:443" -tls1_2 2>/dev/null | grep "Protocol" || echo "")
  TLS13=$(echo | openssl s_client -connect "$DOMAIN:443" -tls1_3 2>/dev/null | grep "Protocol" || echo "")
  [ -n "$TLS12" ] && echo "   ✅ TLS 1.2 supported" || echo "   ❌ TLS 1.2 not detected"
  [ -n "$TLS13" ] && echo "   ✅ TLS 1.3 supported" || echo "   ⚠️  TLS 1.3 not detected"
else
  echo "   ⚠️  Target is HTTP or openssl not available — skipping SSL review"
  echo "   For production, ensure HTTPS with TLS 1.2+ and valid certificate"
fi
echo ""

# Summary
echo "============================================="
echo "📋 Security Audit Complete"
echo "   Reports saved to: $REPORT_DIR/"
echo "   Files:"
ls -1 "$REPORT_DIR/"*"$TIMESTAMP"* 2>/dev/null | sed 's/^/     /'
echo ""
echo "   Next steps:"
echo "   - Review ZAP report for XSS/CSRF findings"
echo "   - Fix any critical npm audit vulnerabilities"
echo "   - Ensure all secrets are in AWS Secrets Manager"
echo "   - Document findings in docs/SECURITY_AUDIT.md"
echo "============================================="
