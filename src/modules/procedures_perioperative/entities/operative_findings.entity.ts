import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'operative_findings' })
export class OperativeFindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'operative_step_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.operative_steps
  operativeStepId?: string;

  @Property({ fieldName: 'finding_code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  findingCodeConceptId!: string;

  @Property({ fieldName: 'finding_text', columnType: 'text' })
  findingText!: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({
    fieldName: 'laterality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lateralityConceptId?: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  severityConceptId?: string;

  @Property({ fieldName: 'observation_id', type: 'uuid', nullable: true }) // FK → clinical.observations
  observationId?: string;

  @Property({
    fieldName: 'recorded_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  recordedByProfileId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
