#!/usr/bin/env -S node

import type { Contract as End } from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract';

import endContract from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/bf06a9a050ce4f0222e9c339fcc0ca23e306291dfa08913c247504eb0bc84079/contract';

import startContract from '../../snapshots/bf06a9a050ce4f0222e9c339fcc0ca23e306291dfa08913c247504eb0bc84079/contract.json' with { type: 'json' };

import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {

  override readonly startContractJson = startContract;

  override readonly endContractJson = endContract;

  override get operations() {
    return [

      rawSql({
        id: 'fk.group_members.groupId',
        label: 'Add group_members group foreign key',
        operationClass: 'additive',
        target: { id: 'postgres' },
        precheck: [{
          description: 'Check group_members foreign key is missing',
          sql: `SELECT NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'group_members_groupId_fkey'
            AND conrelid = 'public.group_members'::regclass
            AND contype = 'f'
          ) AS ok`
        }],
        execute: [{
          description: 'Add group_members group foreign key',
          sql: `ALTER TABLE public.group_members
                ADD CONSTRAINT group_members_groupId_fkey
                FOREIGN KEY ("groupId")
                REFERENCES public.groups(id)`
        }],
        postcheck: [{
          description: 'Verify group_members foreign key exists',
          sql: `SELECT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'group_members_groupId_fkey'
            AND conrelid = 'public.group_members'::regclass
            AND contype = 'f'
          ) AS ok`
        }]
      }),

      rawSql({
        id: 'fk.expenses.groupId',
        label: 'Add expenses group foreign key',
        operationClass: 'additive',
        target: { id: 'postgres' },
        precheck: [{
          description: 'Check expenses foreign key is missing',
          sql: `SELECT NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'expenses_groupId_fkey'
            AND conrelid = 'public.expenses'::regclass
            AND contype = 'f'
          ) AS ok`
        }],
        execute: [{
          description: 'Add expenses group foreign key',
          sql: `ALTER TABLE public.expenses
                ADD CONSTRAINT expenses_groupId_fkey
                FOREIGN KEY ("groupId")
                REFERENCES public.groups(id)`
        }],
        postcheck: [{
          description: 'Verify expenses foreign key exists',
          sql: `SELECT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'expenses_groupId_fkey'
            AND conrelid = 'public.expenses'::regclass
            AND contype = 'f'
          ) AS ok`
        }]
      }),

      rawSql({
        id: 'fk.settlement.groupId',
        label: 'Add settlement group foreign key',
        operationClass: 'additive',
        target: { id: 'postgres' },
        precheck: [{
          description: 'Check settlement foreign key is missing',
          sql: `SELECT NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'settlement_groupId_fkey'
            AND conrelid = 'public.settlement'::regclass
            AND contype = 'f'
          ) AS ok`
        }],
        execute: [{
          description: 'Add settlement group foreign key',
          sql: `ALTER TABLE public.settlement
                ADD CONSTRAINT settlement_groupId_fkey
                FOREIGN KEY ("groupId")
                REFERENCES public.groups(id)`
        }],
        postcheck: [{
          description: 'Verify settlement foreign key exists',
          sql: `SELECT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'settlement_groupId_fkey'
            AND conrelid = 'public.settlement'::regclass
            AND contype = 'f'
          ) AS ok`
        }]
      })

    ];
  }
}

MigrationCLI.run(import.meta.url, M);