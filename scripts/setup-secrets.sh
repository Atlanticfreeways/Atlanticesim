#!/bin/bash
# Atlantic eSIM — AWS Secrets Manager Bootstrap
# Creates secret entries for production deployment
set -e

ENV="${1:-production}"
REGION="${AWS_REGION:-us-east-1}"

echo "🔐 Atlantic eSIM — Secrets Manager Setup ($ENV)"
echo "   Region: $REGION"
echo "============================================="

create_or_update_secret() {
  local SECRET_ID="$1"
  local SECRET_VALUE="$2"

  if aws secretsmanager describe-secret --secret-id "$SECRET_ID" --region "$REGION" 2>/dev/null; then
    echo "   Updating: $SECRET_ID"
    aws secretsmanager update-secret \
      --secret-id "$SECRET_ID" \
      --secret-string "$SECRET_VALUE" \
      --region "$REGION"
  else
    echo "   Creating: $SECRET_ID"
    aws secretsmanager create-secret \
      --name "$SECRET_ID" \
      --secret-string "$SECRET_VALUE" \
      --region "$REGION" \
      --tags Key=Environment,Value="$ENV" Key=Application,Value=atlantic-esim
  fi
}

# 1. App secrets
echo ""
echo "📱 [1/3] App Secrets..."
read -sp "  JWT_SECRET: " JWT_SECRET; echo
read -sp "  ENCRYPTION_KEY: " ENCRYPTION_KEY; echo

create_or_update_secret "atlantic-esim/$ENV/app" "{
  \"JWT_SECRET\": \"$JWT_SECRET\",
  \"ENCRYPTION_KEY\": \"$ENCRYPTION_KEY\",
  \"NODE_ENV\": \"$ENV\"
}"

# 2. Provider API keys
echo ""
echo "📡 [2/3] Provider API Keys..."
read -sp "  AIRALO_CLIENT_ID: " AIRALO_CID; echo
read -sp "  AIRALO_CLIENT_SECRET: " AIRALO_CS; echo
read -sp "  ESIM_GO_API_KEY: " ESIMGO_KEY; echo

create_or_update_secret "atlantic-esim/$ENV/providers" "{
  \"AIRALO_CLIENT_ID\": \"$AIRALO_CID\",
  \"AIRALO_CLIENT_SECRET\": \"$AIRALO_CS\",
  \"ESIM_GO_API_KEY\": \"$ESIMGO_KEY\"
}"

# 3. Database credentials
echo ""
echo "🗄️  [3/3] Database Credentials..."
read -sp "  DATABASE_URL: " DB_URL; echo
read -sp "  REDIS_URL: " REDIS_URL; echo

create_or_update_secret "atlantic-esim/$ENV/database" "{
  \"DATABASE_URL\": \"$DB_URL\",
  \"REDIS_URL\": \"$REDIS_URL\"
}"

echo ""
echo "============================================="
echo "✅ All secrets stored in AWS Secrets Manager"
echo ""
echo "   To enable in app, set these env vars:"
echo "     SECRET_MANAGER_ENABLED=true"
echo "     AWS_REGION=$REGION"
echo ""
echo "   Verify: aws secretsmanager list-secrets --region $REGION --filter Key=tag-key,Values=Application Key=tag-value,Values=atlantic-esim"
echo "============================================="
