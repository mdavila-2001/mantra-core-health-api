import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'availability_exceptions' })
export class AvailabilityExceptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'resource_id', type: 'uuid' }) // FK → scheduling.schedulable_resources
  resourceId!: string;

  @Property({ fieldName: 'exception_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exceptionTypeConceptId!: string;

  @Property({ fieldName: 'start_at', columnType: 'timestamptz' })
  startAt!: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz' })
  endAt!: Date;

  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  @Property({ fieldName: 'is_available', type: 'boolean', nullable: true })
  isAvailable?: boolean;

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
