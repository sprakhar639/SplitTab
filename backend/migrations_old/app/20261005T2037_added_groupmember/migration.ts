#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/8d1044edf47e36bb3f8cda6cefab02c5f894974922a19f28414e6fa3af5f153b/contract';
import startContract from '../../snapshots/8d1044edf47e36bb3f8cda6cefab02c5f894974922a19f28414e6fa3af5f153b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/eab0a0868bad5d2a25f383409dfc843542a835f2866afcba8d40c30cdb029394/contract';
import endContract from '../../snapshots/eab0a0868bad5d2a25f383409dfc843542a835f2866afcba8d40c30cdb029394/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'group_members',
        columns: [
          col('groupId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('joinedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['groupId', 'userId'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'group_members',
        index: 'group_members_groupId_idx_e2fb5578',
        columns: ['groupId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'group_members',
        index: 'group_members_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'group_members',
        foreignKey: {
          name: 'group_members_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'groups', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'group_members',
        foreignKey: {
          name: 'group_members_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
