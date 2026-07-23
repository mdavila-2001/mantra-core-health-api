import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'iam', tableName: 'devices' })
export class Devices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({
    fieldName: 'device_fingerprint',
    columnType: 'varchar',
    nullable: true,
  })
  deviceFingerprint?: string;

  @Property({ fieldName: 'platform_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  platformConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  @Property({
    fieldName: 'push_token_encrypted',
    columnType: 'text',
    nullable: true,
  })
  pushTokenEncrypted?: string;

  @Property({ type: 'boolean', nullable: true })
  trusted?: boolean;

  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
