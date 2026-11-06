#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract';
import startContract from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bf06a9a050ce4f0222e9c339fcc0ca23e306291dfa08913c247504eb0bc84079/contract';
import endContract from '../../snapshots/bf06a9a050ce4f0222e9c339fcc0ca23e306291dfa08913c247504eb0bc84079/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'settlement' }),
      this.createTable({
        schema: 'public',
        table: 'settlements',
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
        table: 'settlements',
        index: 'settlements_fromUserId_idx_9c2ca0ee',
        columns: ['fromUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'settlements',
        index: 'settlements_groupId_idx_e2fb5578',
        columns: ['groupId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'settlements',
        index: 'settlements_toUserId_idx_397e108f',
        columns: ['toUserId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'settlements',
        foreignKey: {
          name: 'settlements_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'groups', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'settlements',
        foreignKey: {
          name: 'settlements_fromUserId_fkey',
          columns: ['fromUserId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'settlements',
        foreignKey: {
          name: 'settlements_toUserId_fkey',
          columns: ['toUserId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
