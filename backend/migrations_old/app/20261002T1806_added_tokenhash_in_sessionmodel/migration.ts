#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8d1044edf47e36bb3f8cda6cefab02c5f894974922a19f28414e6fa3af5f153b/contract';
import endContract from '../../snapshots/8d1044edf47e36bb3f8cda6cefab02c5f894974922a19f28414e6fa3af5f153b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b42b10b3766d7a177b55eb3a611a2874c2d5e0b5ef0983b91ac0595948a72951/contract';
import startContract from '../../snapshots/b42b10b3766d7a177b55eb3a611a2874c2d5e0b5ef0983b91ac0595948a72951/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

 override get operations() {
  return [
    this.addColumn({
      schema: 'public',
      table: 'sessions',
      column: col('tokenHash', 'text', {
        codecRef: { codecId: 'pg/text@1' }
      }),
    }),

    this.setNotNull({
      schema: 'public',
      table: 'sessions',
      column: 'tokenHash'
    }),

    this.addUnique({
      schema: 'public',
      table: 'sessions',
      constraint: 'sessions_tokenHash_key',
      columns: ['tokenHash'],
    }),
  ];
}
}

MigrationCLI.run(import.meta.url, M);
