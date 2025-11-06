import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

if (process.env.NEON_LOCAL_PROXY_URL) {
  // When running behind Neon Local we need to send HTTP traffic to the proxy inside Docker
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_PROXY_URL;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export { sql, db };
