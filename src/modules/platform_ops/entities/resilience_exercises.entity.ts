import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `resilience_exercises`.
 */
@Entity({ schema: 'platform_ops', tableName: 'resilience_exercises' })
export class ResilienceExercises {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  /**
   * Identificador asociado a exercise type concept.
   */
  @Property({ fieldName: 'exercise_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exerciseTypeConceptId!: string;

  /**
   * Valor de scenario name mantenido por la instancia.
   */
  @Property({ fieldName: 'scenario_name', columnType: 'varchar' })
  scenarioName!: string;

  /**
   * Valor de hypothesis text mantenido por la instancia.
   */
  @Property({
    fieldName: 'hypothesis_text',
    columnType: 'text',
    nullable: true,
  })
  hypothesisText?: string;

  /**
   * Valor de planned at mantenido por la instancia.
   */
  @Property({
    fieldName: 'planned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedAt?: Date;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de observed rto seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'observed_rto_seconds',
    type: 'bigint',
    nullable: true,
  })
  observedRtoSeconds?: string;

  /**
   * Valor de observed rpo seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'observed_rpo_seconds',
    type: 'bigint',
    nullable: true,
  })
  observedRpoSeconds?: string;

  /**
   * Valor de evidence uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_uri',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceUri?: string;

  /**
   * Valor de findings json mantenido por la instancia.
   */
  @Property({
    fieldName: 'findings_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  findingsJson?: unknown;

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
