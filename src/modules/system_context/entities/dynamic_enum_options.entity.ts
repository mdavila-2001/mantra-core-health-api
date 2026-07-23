import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'dynamic_enum_options' })
export class DynamicEnumOptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dynamic_enum_version_id', type: 'uuid' }) // FK → system_context.dynamic_enum_versions
  dynamicEnumVersionId!: string;

  @Property({ fieldName: 'concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  conceptId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  display!: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'is_default', type: 'boolean', nullable: true })
  isDefault?: boolean;

  @Property({ type: 'boolean', nullable: true })
  enabled?: boolean;

  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
