import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_terminology_mapping_rules`.
 */
@Entity({
  schema: 'health_data',
  tableName: 'health_terminology_mapping_rules',
})
export class HealthTerminologyMappingRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health terminology mapping set.
   */
  @Property({ fieldName: 'health_terminology_mapping_set_id', type: 'uuid' }) // FK → health_data.health_terminology_mapping_sets
  healthTerminologyMappingSetId!: string;

  /**
   * Valor de source code mantenido por la instancia.
   */
  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  /**
   * Identificador asociado a target concept.
   */
  @Property({ fieldName: 'target_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetConceptId!: string;

  /**
   * Identificador asociado a equivalence concept.
   */
  @Property({ fieldName: 'equivalence_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  equivalenceConceptId!: string;

  /**
   * Valor de context expression mantenido por la instancia.
   */
  @Property({
    fieldName: 'context_expression',
    columnType: 'text',
    nullable: true,
  })
  contextExpression?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric(8,5)',
    nullable: true,
  })
  confidenceScore?: string;

  /**
   * Valor de mapping comment mantenido por la instancia.
   */
  @Property({
    fieldName: 'mapping_comment',
    columnType: 'text',
    nullable: true,
  })
  mappingComment?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
