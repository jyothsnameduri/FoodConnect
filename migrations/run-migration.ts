import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

// Get the database connection string from environment or use a default
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_xiz8aFd7PZYw@ep-orange-fire-a43aed2t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function runMigration() {
  try {
    console.log('Running migration to remove pickup time fields...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '0001_remove_pickup_time_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
