#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/bc5558ff380ea62d05f777c076bb1862bc25de7a98a0e0da55c1a5acd0ad5b3f/contract';
import startContract from '../../snapshots/bc5558ff380ea62d05f777c076bb1862bc25de7a98a0e0da55c1a5acd0ad5b3f/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d96dc94828b21ab56e7d27f264efc786b97c5ad7ae41b18f52a878a95c6d5236/contract';
import endContract from '../../snapshots/d96dc94828b21ab56e7d27f264efc786b97c5ad7ae41b18f52a878a95c6d5236/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'groups',
        column: col('deletedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'groups',
        column: col('isDeleted', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
