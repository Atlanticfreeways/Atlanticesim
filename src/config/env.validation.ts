import * as Joi from 'joi';

export const validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),

    // Database
    DATABASE_URL: Joi.string().required(),

    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION: Joi.string().default('1d'),

    // Provider API Keys (Make optional for dev, required for prod if strictly needed, 
    // but usually we want app to start even if some providers are not configured)
    AIRALO_CLIENT_ID: Joi.string().optional(),
    AIRALO_CLIENT_SECRET: Joi.string().optional(),
    ESIM_GO_API_KEY: Joi.string().optional(),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

    // Encryption
    ENCRYPTION_KEY: Joi.string().min(32).required(),

    // Allowed Origins
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:3001'),
});
