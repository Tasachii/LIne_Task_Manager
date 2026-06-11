import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResultRow, types } from 'pg';

// Parse DATE (OID 1082) as a plain 'YYYY-MM-DD' string to avoid timezone shifts during serialization.
types.setTypeParser(types.builtins.DATE, (v) => v);

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  // Thin query helper.
  async query<T extends QueryResultRow = any>(sql: string, params: any[] = []) {
    const res = await this.pool.query<T>(sql, params);
    return res.rows;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
