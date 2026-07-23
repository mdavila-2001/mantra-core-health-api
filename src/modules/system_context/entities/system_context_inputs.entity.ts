import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'system_context_inputs' })
export class SystemContextInputs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'system_context_version_id', type: 'uuid' }) // FK → system_context.system_context_versions
  systemContextVersionId!: string;

  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  @Property({ fieldName: 'source_schema_name', columnType: 'varchar' })
  sourceSchemaName!: string;

  @Property({ fieldName: 'source_entity_name', columnType: 'varchar' })
  sourceEntityName!: string;

  @Property({ fieldName: 'source_record_id', type: 'uuid' })
  sourceRecordId!: string;

  @Property({ fieldName: 'source_version_id', type: 'uuid', nullable: true })
  sourceVersionId?: string;

  @Property({ fieldName: 'source_content_hash', columnType: 'varchar' })
  sourceContentHash!: string;

  @Property({
    fieldName: 'source_freshness_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourceFreshnessAt?: Date;

  @Property({ columnType: 'int', nullable: true })
  precedence?: number;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
