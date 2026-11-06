#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract';
import endContract from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/eab0a0868bad5d2a25f383409dfc843542a835f2866afcba8d40c30cdb029394/contract';
import startContract from '../../snapshots/eab0a0868bad5d2a25f383409dfc843542a835f2866afcba8d40c30cdb029394/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'groups',
        column: col('createdById', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.setNotNull({ schema: 'public', table: 'groups', column: 'createdById' }),
      this.createIndex({
        schema: 'public',
        table: 'groups',
        index: 'groups_createdById_idx_8bf640ed',
        columns: ['createdById'],
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
