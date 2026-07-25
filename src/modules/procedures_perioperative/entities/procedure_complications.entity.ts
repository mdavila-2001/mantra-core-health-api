import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_complications',
})
export class ProcedureComplications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  procedureId?: string;

  @Property({ fieldName: 'complication_code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  complicationCodeConceptId!: string;

  @Property({ fieldName: 'onset_at', columnType: 'timestamptz' })
  onsetAt!: Date;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'relatedness_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relatednessConceptId!: string;

  @Property({ fieldName: 'condition_id', type: 'uuid', nullable: true }) // FK → clinical.conditions
  conditionId?: string;

  @Property({
    fieldName: 'management_text',
    columnType: 'text',
    nullable: true,
  })
  managementText?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  @Property({
    fieldName: 'reported_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  reportedByProfileId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
