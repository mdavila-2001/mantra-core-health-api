import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_definition_set_versions' })
export class FieldDefinitionSetVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'definition_set_id', type: 'uuid' }) // FK (destino no resuelto)
  definitionSetId!: string;

  @Property({ fieldName: 'semantic_version', columnType: 'varchar' })
  semanticVersion!: string;

  @Property({ fieldName: 'schema_hash', columnType: 'varchar' })
  schemaHash!: string;

  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({
    fieldName: 'publication_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  publicationStatusConceptId?: string;

  @Property({
    fieldName: 'compatibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  compatibilityConceptId?: string;

  @Property({
    fieldName: 'fhir_structure_definition_url',
    columnType: 'text',
    nullable: true,
  })
  fhirStructureDefinitionUrl?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
