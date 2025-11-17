// ============================================================================
// DATABASE MIGRATION SCRIPT
// Ejecuta el schema.sql para crear las tablas
// ============================================================================

import fs from 'fs';
import path from 'path';
import database from './database';

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    await database.query(schemaSql);

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
