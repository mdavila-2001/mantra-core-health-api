import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_study_offerings' })
export class DiagnosticStudyOfferings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId!: string;

  @Property({
    fieldName: 'diagnostic_unit_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_unit_sites
  diagnosticUnitSiteId?: string;

  @Property({ fieldName: 'study_code', columnType: 'varchar' })
  studyCode!: string;

  @Property({ fieldName: 'study_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  studyConceptId!: string;

  @Property({ fieldName: 'modality_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modalityConceptId?: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({
    fieldName: 'specimen_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  specimenTypeConceptId?: string;

  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({
    fieldName: 'preparation_instructions',
    columnType: 'text',
    nullable: true,
  })
  preparationInstructions?: string;

  @Property({
    fieldName: 'expected_duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  expectedDurationMinutes?: number;

  @Property({
    fieldName: 'expected_turnaround_minutes',
    columnType: 'int',
    nullable: true,
  })
  expectedTurnaroundMinutes?: number;

  @Property({
    fieldName: 'requires_medical_order',
    type: 'boolean',
    nullable: true,
  })
  requiresMedicalOrder?: boolean;

  @Property({
    fieldName: 'requires_prior_authorization',
    type: 'boolean',
    nullable: true,
  })
  requiresPriorAuthorization?: boolean;

  @Property({
    fieldName: 'home_collection_eligible',
    type: 'boolean',
    nullable: true,
  })
  homeCollectionEligible?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
