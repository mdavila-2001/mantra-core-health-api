import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'resilience_exercises' })
export class ResilienceExercises {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ fieldName: 'exercise_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exerciseTypeConceptId!: string;

  @Property({ fieldName: 'scenario_name', columnType: 'varchar' })
  scenarioName!: string;

  @Property({
    fieldName: 'hypothesis_text',
    columnType: 'text',
    nullable: true,
  })
  hypothesisText?: string;

  @Property({
    fieldName: 'planned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedAt?: Date;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({
    fieldName: 'observed_rto_seconds',
    type: 'bigint',
    nullable: true,
  })
  observedRtoSeconds?: string;

  @Property({
    fieldName: 'observed_rpo_seconds',
    type: 'bigint',
    nullable: true,
  })
  observedRpoSeconds?: string;

  @Property({
    fieldName: 'evidence_uri',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceUri?: string;

  @Property({
    fieldName: 'findings_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  findingsJson?: unknown;

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
