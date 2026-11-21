#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c48579612fa747b1ceec4c53511771ecf7d66308a70f2f65743ce4ecaea84983/contract';
import endContract from '../../snapshots/c48579612fa747b1ceec4c53511771ecf7d66308a70f2f65743ce4ecaea84983/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d96dc94828b21ab56e7d27f264efc786b97c5ad7ae41b18f52a878a95c6d5236/contract';
import startContract from '../../snapshots/d96dc94828b21ab56e7d27f264efc786b97c5ad7ae41b18f52a878a95c6d5236/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'settlement',
        column: col('is_deleted', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
