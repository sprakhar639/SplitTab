#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b42b10b3766d7a177b55eb3a611a2874c2d5e0b5ef0983b91ac0595948a72951/contract';
import endContract from '../../snapshots/b42b10b3766d7a177b55eb3a611a2874c2d5e0b5ef0983b91ac0595948a72951/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fd497a80f6db6cc6eb3bfc72c1dc334153e97ab4648c13fc614041c58ba9ea36/contract';
import startContract from '../../snapshots/fd497a80f6db6cc6eb3bfc72c1dc334153e97ab4648c13fc614041c58ba9ea36/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'sessions',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sessions',
        index: 'sessions_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sessions',
        foreignKey: {
          name: 'sessions_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
