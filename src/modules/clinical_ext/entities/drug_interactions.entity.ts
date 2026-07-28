import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `drug_interactions`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'drug_interactions' })
export class DrugInteractions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a substance aconcept.
   */
  @Property({ fieldName: 'substance_a_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  substanceAConceptId!: string;

  /**
   * Identificador asociado a substance bconcept.
   */
  @Property({ fieldName: 'substance_b_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  substanceBConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Valor de mechanism text mantenido por la instancia.
   */
  @Property({ fieldName: 'mechanism_text', columnType: 'text', nullable: true })
  mechanismText?: string;

  /**
   * Valor de management text mantenido por la instancia.
   */
  @Property({
    fieldName: 'management_text',
    columnType: 'text',
    nullable: true,
  })
  managementText?: string;

  /**
   * Identificador asociado a evidence level concept.
   */
  @Property({
    fieldName: 'evidence_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  evidenceLevelConceptId?: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  source?: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_version',
    columnType: 'varchar',
    nullable: true,
  })
  sourceVersion?: string;

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
