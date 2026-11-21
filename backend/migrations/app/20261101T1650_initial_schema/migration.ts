#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract';
import endContract from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'expense_splits',
        columns: [
          col('amount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('expenseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['expenseId', 'userId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'expenses',
        columns: [
          col('amount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('groupId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('paidBy', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
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
      this.createTable({
        schema: 'public',
        table: 'groups',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
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
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
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
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('username', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sessions',
        constraint: 'sessions_tokenHash_key',
        columns: ['tokenHash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_username_key',
        columns: ['username'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expense_splits',
        index: 'expense_splits_expenseId_idx_69d413fa',
        columns: ['expenseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expense_splits',
        index: 'expense_splits_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expenses',
        index: 'expenses_groupId_idx_e2fb5578',
        columns: ['groupId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expenses',
        index: 'expenses_paidBy_idx_c34eb888',
        columns: ['paidBy'],
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
      this.createIndex({
        schema: 'public',
        table: 'groups',
        index: 'groups_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sessions',
        index: 'sessions_userId_idx_a489d58a',
        columns: ['userId'],
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
        table: 'expense_splits',
        foreignKey: {
          name: 'expense_splits_expenseId_fkey',
          columns: ['expenseId'],
          references: { schema: 'public', table: 'expenses', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'expense_splits',
        foreignKey: {
          name: 'expense_splits_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'expenses',
        foreignKey: {
          name: 'expenses_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'groups', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'expenses',
        foreignKey: {
          name: 'expenses_paidBy_fkey',
          columns: ['paidBy'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
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
      this.addForeignKey({
        schema: 'public',
        table: 'groups',
        foreignKey: {
          name: 'groups_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
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
      this.addCheckConstraint({
  schema: 'public',
  table: 'expenses',
  constraint: 'expenses_amount_positive',
  expression: '"amount" > 0',
}),

this.addCheckConstraint({
  schema: 'public',
  table: 'expense_splits',
  constraint: 'expense_splits_amount_positive',
  expression: '"amount" > 0',
}),

this.addCheckConstraint({
  schema: 'public',
  table: 'settlement',
  constraint: 'settlement_amount_positive',
  expression: '"amount" > 0',
}),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
