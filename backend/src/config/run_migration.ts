import fs from 'fs';
import path from 'path';
import database from './database';

async function runMigration() {
  try {
    console.log('🔄 Running migration: 002_enable_rls.sql...');

    const schemaPath = path.join(__dirname, 'migrations', '002_enable_rls.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    await database.query(schemaSql);

    console.log('✅ RLS Policies applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
