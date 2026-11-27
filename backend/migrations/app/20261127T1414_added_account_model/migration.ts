#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/29030e266de73e7839413ee233c7aa47c9cc2a26dc4965789845d62eccc1770b/contract';
import startContract from '../../snapshots/29030e266de73e7839413ee233c7aa47c9cc2a26dc4965789845d62eccc1770b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f18b9fe0bcd3268ff0e311b5a6d23c57c5992c404196412ea058a5c517590f6f/contract';
import endContract from '../../snapshots/f18b9fe0bcd3268ff0e311b5a6d23c57c5992c404196412ea058a5c517590f6f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'accounts',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('providerAccountId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'accounts',
        constraint: 'accounts_provider_providerAccountId_key',
        columns: ['provider', 'providerAccountId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'accounts',
        index: 'accounts_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'accounts',
        foreignKey: {
          name: 'accounts_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
