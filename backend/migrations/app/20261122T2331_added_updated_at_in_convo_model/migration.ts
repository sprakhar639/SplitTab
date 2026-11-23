#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4575d38f93e7cb53876cb4a3060fc1e0045c960170499f944633a77e6fd5bf17/contract';
import endContract from '../../snapshots/4575d38f93e7cb53876cb4a3060fc1e0045c960170499f944633a77e6fd5bf17/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f46045a303d0b139ece12174a1c1c371626c9e275441e95563eed62d05a1351d/contract';
import startContract from '../../snapshots/f46045a303d0b139ece12174a1c1c371626c9e275441e95563eed62d05a1351d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'conversations',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.setNotNull({
        schema: 'public',
        table: 'conversations',
        column: 'updatedAt',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);