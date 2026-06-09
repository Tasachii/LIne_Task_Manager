import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  // query helper แบบบางๆ
  async query<T extends QueryResultRow = any>(sql: string, params: any[] = []) {
    const res = await this.pool.query<T>(sql, params);
    return res.rows;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
