-- Add FUP (Fair Usage Policy) tracking to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS fair_usage_note TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS throttle_after_gb DECIMAL(10, 2);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS throttle_speed_mbps INTEGER;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS cost_per_gb DECIMAL(10, 4);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS provider_api_version VARCHAR(20);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS deprecation_reason VARCHAR(255);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS last_sync_error TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS user_fup_feedback_count INT DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS user_fup_accuracy_score DECIMAL(3, 2);

-- Create sync_history table for tracking sync operations
CREATE TABLE IF NOT EXISTS sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id VARCHAR(50) NOT NULL,
  sync_started_at TIMESTAMP NOT NULL,
  sync_completed_at TIMESTAMP,
  packages_synced INT DEFAULT 0,
  packages_failed INT DEFAULT 0,
  error_message TEXT,
  sync_duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create provider_health table for tracking provider performance
CREATE TABLE IF NOT EXISTS provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id VARCHAR(50) NOT NULL UNIQUE,
  health_score DECIMAL(3, 2) DEFAULT 1.0,
  latency_ms INT,
  error_rate DECIMAL(5, 2) DEFAULT 0.0,
  last_check_at TIMESTAMP,
  consecutive_failures INT DEFAULT 0,
  is_degraded BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pricing_rules table for flexible pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority INT NOT NULL,
  condition_json JSONB NOT NULL,
  retail_price DECIMAL(10, 2),
  expires_at TIMESTAMP,
  applied_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_fup_note ON packages(fair_usage_note);
CREATE INDEX IF NOT EXISTS idx_packages_throttle ON packages(throttle_after_gb);
CREATE INDEX IF NOT EXISTS idx_packages_cost_per_gb ON packages(cost_per_gb);
CREATE INDEX IF NOT EXISTS idx_packages_active_search ON packages(is_active, scope_type, package_type, price) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sync_history_provider ON sync_history(provider_id, sync_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_health_score ON provider_health(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC, expires_at DESC);
