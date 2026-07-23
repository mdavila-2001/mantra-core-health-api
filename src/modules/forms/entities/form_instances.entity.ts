import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'form_instances' })
export class FormInstances {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  @Property({ fieldName: 'resource_id', type: 'uuid' })
  resourceId!: string;

  @Property({ fieldName: 'tenant_context_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  tenantContextId?: string;

  @Property({ fieldName: 'schema_version', columnType: 'int' })
  schemaVersion!: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

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
