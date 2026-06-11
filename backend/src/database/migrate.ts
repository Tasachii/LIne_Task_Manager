import 'dotenv/config';
import { Pool } from 'pg';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Runs all SQL files in ../../migrations in filename order.
async function main() {
  const dir = join(__dirname, '..', '..', '..', 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    process.stdout.write(`run ${file} ... `);
    await pool.query(sql);
    console.log('ok');
  }
  await pool.end();
  console.log('migration done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
