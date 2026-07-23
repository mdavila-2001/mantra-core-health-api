import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'anesthesia_plans' })
export class AnesthesiaPlans {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'anesthesiologist_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  anesthesiologistProfileId!: string;

  @Property({ fieldName: 'anesthesia_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  anesthesiaTypeConceptId!: string;

  @Property({ fieldName: 'technique_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  techniqueConceptId?: string;

  @Property({
    fieldName: 'airway_plan_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  airwayPlanConceptId?: string;

  @Property({
    fieldName: 'monitoring_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  monitoringPlanJson?: unknown;

  @Property({
    fieldName: 'medications_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  medicationsPlanJson?: unknown;

  @Property({
    fieldName: 'fluids_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fluidsPlanJson?: unknown;

  @Property({
    fieldName: 'blood_products_plan_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  bloodProductsPlanJson?: unknown;

  @Property({
    fieldName: 'postoperative_analgesia_plan_text',
    columnType: 'text',
    nullable: true,
  })
  postoperativeAnalgesiaPlanText?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

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
