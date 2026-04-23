// Force .env values to override system environment variables
// This must run BEFORE any application code loads
require('dotenv').config({ path: '.env', override: true });
