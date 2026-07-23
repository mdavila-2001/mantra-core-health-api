import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'segments' })
export class MarketingSegments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'segment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  segmentTypeConceptId!: string;

  @Property({
    fieldName: 'definition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  definitionJson?: unknown;

  @Property({ fieldName: 'source_read_model_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  sourceReadModelId?: string;

  @Property({ fieldName: 'estimated_size', type: 'bigint', nullable: true })
  estimatedSize?: string;

  @Property({
    fieldName: 'last_refreshed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRefreshedAt?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
