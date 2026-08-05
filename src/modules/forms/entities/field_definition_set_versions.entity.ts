import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_definition_set_versions`.
 */
@Entity({ schema: 'forms', tableName: 'field_definition_set_versions' })
export class FieldDefinitionSetVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a definition set.
   */
  @Property({ fieldName: 'definition_set_id', type: 'uuid' }) // FK → forms.field_definition_sets
  definitionSetId!: string;

  /**
   * Valor de semantic version mantenido por la instancia.
   */
  @Property({ fieldName: 'semantic_version', columnType: 'varchar' })
  semanticVersion!: string;

  /**
   * Valor de schema hash mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_hash', columnType: 'varchar' })
  schemaHash!: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Identificador asociado a publication status concept.
   */
  @Property({
    fieldName: 'publication_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  publicationStatusConceptId?: string;

  /**
   * Identificador asociado a compatibility concept.
   */
  @Property({
    fieldName: 'compatibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  compatibilityConceptId?: string;

  /**
   * Valor de fhir structure definition url mantenido por la instancia.
   */
  @Property({
    fieldName: 'fhir_structure_definition_url',
    columnType: 'text',
    nullable: true,
  })
  fhirStructureDefinitionUrl?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
