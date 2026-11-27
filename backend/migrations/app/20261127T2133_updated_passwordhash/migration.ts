#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/193f2233d63b3d131dc3c19ac2432c4f0c6a92a05b065ea71168a5e22b2724ea/contract';
import endContract from '../../snapshots/193f2233d63b3d131dc3c19ac2432c4f0c6a92a05b065ea71168a5e22b2724ea/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f18b9fe0bcd3268ff0e311b5a6d23c57c5992c404196412ea058a5c517590f6f/contract';
import startContract from '../../snapshots/f18b9fe0bcd3268ff0e311b5a6d23c57c5992c404196412ea058a5c517590f6f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropNotNull({ schema: 'public', table: 'users', column: 'passwordHash' })];
  }
}

MigrationCLI.run(import.meta.url, M);
