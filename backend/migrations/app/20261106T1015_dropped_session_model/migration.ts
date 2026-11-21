#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract';
import startContract from '../../snapshots/9b31ae8211d1ffcfbe7b0ac37d4ec67b59183c3d63aa670048b9150906831b29/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bc5558ff380ea62d05f777c076bb1862bc25de7a98a0e0da55c1a5acd0ad5b3f/contract';
import endContract from '../../snapshots/bc5558ff380ea62d05f777c076bb1862bc25de7a98a0e0da55c1a5acd0ad5b3f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropTable({ schema: 'public', table: 'sessions' })];
  }
}

MigrationCLI.run(import.meta.url, M);
