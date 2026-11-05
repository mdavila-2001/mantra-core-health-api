import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `concept_relationship_evidence`.
 */
@Entity({ schema: 'terminology', tableName: 'concept_relationship_evidence' })
export class ConceptRelationshipEvidence {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a concept relationship.
   */
  @Property({ fieldName: 'concept_relationship_id', type: 'uuid' }) // FK → terminology.concept_relationships
  conceptRelationshipId!: string;

  /**
   * Identificador asociado a terminology source.
   */
  @Property({ fieldName: 'terminology_source_id', type: 'uuid' }) // FK → terminology.terminology_sources
  terminologySourceId!: string;

  /**
   * Identificador asociado a code system version.
   */
  @Property({ fieldName: 'code_system_version_id', type: 'uuid' }) // FK → terminology.code_system_versions
  codeSystemVersionId!: string;

  /**
   * Identificador asociado a evidence tier concept.
   */
  @Property({ fieldName: 'evidence_tier_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceTierConceptId!: string;

  /**
   * Valor de source reference mantenido por la instancia.
   */
  @Property({ fieldName: 'source_reference', columnType: 'varchar' })
  sourceReference!: string;

  /**
   * Valor de citation text mantenido por la instancia.
   */
  @Property({ fieldName: 'citation_text', columnType: 'text', nullable: true })
  citationText?: string;

  /**
   * Valor de citation locator mantenido por la instancia.
   */
  @Property({
    fieldName: 'citation_locator',
    columnType: 'varchar',
    nullable: true,
  })
  citationLocator?: string;

  /**
   * Identificador asociado a frequency concept.
   */
  @Property({ fieldName: 'frequency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  frequencyConceptId?: string;

  /**
   * Valor de frequency numerator mantenido por la instancia.
   */
  @Property({
    fieldName: 'frequency_numerator',
    columnType: 'int',
    nullable: true,
  })
  frequencyNumerator?: number;

  /**
   * Valor de frequency denominator mantenido por la instancia.
   */
  @Property({
    fieldName: 'frequency_denominator',
    columnType: 'int',
    nullable: true,
  })
  frequencyDenominator?: number;

  /**
   * Valor de statistic value mantenido por la instancia.
   */
  @Property({
    fieldName: 'statistic_value',
    columnType: 'numeric',
    nullable: true,
  })
  statisticValue?: string;

  /**
   * Identificador asociado a sex concept.
   */
  @Property({ fieldName: 'sex_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sexConceptId?: string;

  /**
   * Valor de age min days mantenido por la instancia.
   */
  @Property({ fieldName: 'age_min_days', columnType: 'int', nullable: true })
  ageMinDays?: number;

  /**
   * Valor de age max days mantenido por la instancia.
   */
  @Property({ fieldName: 'age_max_days', columnType: 'int', nullable: true })
  ageMaxDays?: number;

  /**
   * Identificador asociado a pregnancy applicability concept.
   */
  @Property({
    fieldName: 'pregnancy_applicability_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  pregnancyApplicabilityConceptId?: string;

  /**
   * Identificador asociado a care level concept.
   */
  @Property({
    fieldName: 'care_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  careLevelConceptId?: string;

  /**
   * Identificador asociado a line of therapy concept.
   */
  @Property({
    fieldName: 'line_of_therapy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lineOfTherapyConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
