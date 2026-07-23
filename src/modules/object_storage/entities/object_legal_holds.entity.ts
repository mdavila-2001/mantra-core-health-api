import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_legal_holds' })
export class ObjectLegalHolds {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  @Property({ fieldName: 'legal_case_reference', columnType: 'varchar' })
  legalCaseReference!: string;

  @Property({ fieldName: 'hold_state', columnType: 'varchar' })
  holdState!: string;

  @Property({ fieldName: 'placed_by_user_id', type: 'uuid' })
  placedByUserId!: string;

  @Property({ fieldName: 'placed_at', columnType: 'timestamptz' })
  placedAt!: Date;

  @Property({ fieldName: 'released_at', columnType: 'timestamptz' })
  releasedAt!: Date;
}
