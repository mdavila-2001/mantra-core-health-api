import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'dynamic_enum_versions' })
export class DynamicEnumVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dynamic_enum_definition_id', type: 'uuid' }) // FK → system_context.dynamic_enum_definitions
  dynamicEnumDefinitionId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'value_set_version_id', type: 'uuid' }) // FK → terminology.value_set_versions
  valueSetVersionId!: string;

  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  @Property({ fieldName: 'cache_token', columnType: 'varchar', nullable: true })
  cacheToken?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
