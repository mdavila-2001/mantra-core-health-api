import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'terminology', tableName: 'concept_relationship_evidence' })
export class ConceptRelationshipEvidence {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'concept_relationship_id', type: 'uuid' }) // FK → terminology.concept_relationships
  conceptRelationshipId!: string;

  @Property({ fieldName: 'terminology_source_id', type: 'uuid' }) // FK → terminology.terminology_sources
  terminologySourceId!: string;

  @Property({ fieldName: 'code_system_version_id', type: 'uuid' }) // FK → terminology.code_system_versions
  codeSystemVersionId!: string;

  @Property({ fieldName: 'evidence_tier_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceTierConceptId!: string;

  @Property({ fieldName: 'source_reference', columnType: 'varchar' })
  sourceReference!: string;

  @Property({ fieldName: 'citation_text', columnType: 'text', nullable: true })
  citationText?: string;

  @Property({
    fieldName: 'citation_locator',
    columnType: 'varchar',
    nullable: true,
  })
  citationLocator?: string;

  @Property({ fieldName: 'frequency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  frequencyConceptId?: string;

  @Property({
    fieldName: 'frequency_numerator',
    columnType: 'int',
    nullable: true,
  })
  frequencyNumerator?: number;

  @Property({
    fieldName: 'frequency_denominator',
    columnType: 'int',
    nullable: true,
  })
  frequencyDenominator?: number;

  @Property({
    fieldName: 'statistic_value',
    columnType: 'numeric',
    nullable: true,
  })
  statisticValue?: string;

  @Property({ fieldName: 'sex_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sexConceptId?: string;

  @Property({ fieldName: 'age_min_days', columnType: 'int', nullable: true })
  ageMinDays?: number;

  @Property({ fieldName: 'age_max_days', columnType: 'int', nullable: true })
  ageMaxDays?: number;

  @Property({
    fieldName: 'pregnancy_applicability_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  pregnancyApplicabilityConceptId?: string;

  @Property({
    fieldName: 'care_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  careLevelConceptId?: string;

  @Property({
    fieldName: 'line_of_therapy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lineOfTherapyConceptId?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date' })
  validFrom!: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
