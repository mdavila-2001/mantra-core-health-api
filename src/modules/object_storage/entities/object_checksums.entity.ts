import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_checksums' })
export class ObjectChecksums {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  @Property({ columnType: 'varchar' })
  algorithm!: string;

  @Property({ columnType: 'varchar' })
  checksum!: string;

  @Property({ columnType: 'varchar' })
  source!: string;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;

  @Property({ fieldName: 'verification_status', columnType: 'varchar' })
  verificationStatus!: string;
}
