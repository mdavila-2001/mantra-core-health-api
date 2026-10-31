import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'observability', tableName: 'instances' })
export class Instances {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  kind!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'build_commit',
    columnType: 'varchar',
    nullable: true,
  })
  buildCommit?: string;

  @Property({
    fieldName: 'build_version',
    columnType: 'varchar',
    nullable: true,
  })
  buildVersion?: string;

  @Property({
    fieldName: 'host_hash',
    columnType: 'varchar(64)',
    nullable: true,
  })
  hostHash?: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({
    fieldName: 'last_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  lastSnapshotJson?: unknown;

  @Property({ type: 'boolean', nullable: true })
  expected?: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
