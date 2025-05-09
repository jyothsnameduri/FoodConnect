// Script to execute the SQL to remove pickup_start_time and pickup_end_time columns
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection details from server/db.ts
const DATABASE_URL = "postgresql://neondb_owner:npg_xiz8aFd7PZYw@ep-orange-fire-a43aed2t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function removePickupColumns() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'remove_pickup_columns.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL to remove pickup_start_time and pickup_end_time columns...');
    
    // Execute the SQL query
    await pool.query(sqlQuery);
    
    console.log('Successfully removed pickup_start_time and pickup_end_time columns from food_posts table!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

removePickupColumns();
