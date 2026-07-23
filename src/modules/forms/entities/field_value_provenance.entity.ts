import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_value_provenance' })
export class FieldValueProvenance {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'field_value_id', type: 'uuid' }) // FK → forms.field_values
  fieldValueId!: string;

  @Property({
    fieldName: 'source_system_uri',
    columnType: 'text',
    nullable: true,
  })
  sourceSystemUri?: string;

  @Property({
    fieldName: 'source_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceType?: string;

  @Property({
    fieldName: 'source_resource_id',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceId?: string;

  @Property({
    fieldName: 'source_version',
    columnType: 'varchar',
    nullable: true,
  })
  sourceVersion?: string;

  @Property({ fieldName: 'import_batch_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  importBatchId?: string;

  @Property({ fieldName: 'author_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  authorProfileId?: string;

  @Property({ fieldName: 'entered_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  enteredByUserId?: string;

  @Property({
    fieldName: 'verification_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  verificationStatusConceptId?: string;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
