#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/fbf70c5eff3610c2234acbc497be41832df9cd477ae9fd69e583ca77870de244/contract';
import startContract from '../../snapshots/fbf70c5eff3610c2234acbc497be41832df9cd477ae9fd69e583ca77870de244/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fd497a80f6db6cc6eb3bfc72c1dc334153e97ab4648c13fc614041c58ba9ea36/contract';
import endContract from '../../snapshots/fd497a80f6db6cc6eb3bfc72c1dc334153e97ab4648c13fc614041c58ba9ea36/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropTable({ schema: 'public', table: 'group_members' })];
  }
}

MigrationCLI.run(import.meta.url, M);
