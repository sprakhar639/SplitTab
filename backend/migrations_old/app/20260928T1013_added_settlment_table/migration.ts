#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/ebe07e776fbfa14666439f3c1234fc6442caa537ce2c78c5411a20c3fb096368/contract';
import startContract from '../../snapshots/ebe07e776fbfa14666439f3c1234fc6442caa537ce2c78c5411a20c3fb096368/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fbf70c5eff3610c2234acbc497be41832df9cd477ae9fd69e583ca77870de244/contract';
import endContract from '../../snapshots/fbf70c5eff3610c2234acbc497be41832df9cd477ae9fd69e583ca77870de244/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'settlement',
        columns: [
          col('amount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fromUserId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('groupId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('toUserId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'settlement',
        index: 'settlement_fromUserId_idx_9c2ca0ee',
        columns: ['fromUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'settlement',
        index: 'settlement_groupId_idx_e2fb5578',
        columns: ['groupId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'settlement',
        index: 'settlement_toUserId_idx_397e108f',
        columns: ['toUserId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'settlement',
        foreignKey: {
          name: 'settlement_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'groups', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'settlement',
        foreignKey: {
          name: 'settlement_fromUserId_fkey',
          columns: ['fromUserId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'settlement',
        foreignKey: {
          name: 'settlement_toUserId_fkey',
          columns: ['toUserId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
