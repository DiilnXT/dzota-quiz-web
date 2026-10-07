const { execSync } = require('child_process');

// Ensure Prisma has fallback env vars if only one Postgres URL is configured in Vercel
const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (dbUrl) {
  if (!process.env.POSTGRES_PRISMA_URL) {
    process.env.POSTGRES_PRISMA_URL = dbUrl;
  }
  if (!process.env.POSTGRES_URL_NON_POOLING) {
    process.env.POSTGRES_URL_NON_POOLING = dbUrl;
  }
}

try {
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    console.log('ℹ️ No database connection string detected in current environment. Skipping db push.');
  } else {
    console.log('🔄 Checking and syncing database schema with Prisma db push...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    console.log('✅ Prisma database schema synced successfully.');
  }
} catch (error) {
  console.warn('⚠️ Warning: Prisma db push was skipped or encountered an issue:', error.message);
  console.warn('Continuing Next.js build...');
}
