import app from './app';
import { config } from './config';
import { prisma } from './lib/prisma';
import fs from 'fs';
import path from 'path';


async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('Running without database - some features will be unavailable');
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.listen(config.port, () => {
    console.log(`RajWorthman API running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

main().catch(console.error);
