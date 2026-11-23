import dotenv from 'dotenv';
dotenv.config();

const WEAK = ['fallback-secret', 'fallback-refresh-secret', 'secret', 'changeme', ''];
const jwtSecret = process.env.JWT_SECRET || '';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';
if (WEAK.includes(jwtSecret) || WEAK.includes(jwtRefreshSecret)) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set to strong values in .env');
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',').map((o) => o.trim()).filter(Boolean),
  // No SMS provider yet: test mode accepts one fixed OTP for every number. Turn off before real launch.
  otp: {
    testMode: (process.env.OTP_TEST_MODE ?? 'true') === 'true',
    testCode: process.env.OTP_TEST_CODE || '1234',
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.FROM_EMAIL || 'noreply@rajworthman.com',
  },
};
