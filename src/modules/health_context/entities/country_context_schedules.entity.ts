import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `country_context_schedules`.
 */
@Entity({ schema: 'health_context', tableName: 'country_context_schedules' })
export class CountryContextSchedules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  /**
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  /**
   * Valor de schedule expression mantenido por la instancia.
   */
  @Property({ fieldName: 'schedule_expression', columnType: 'varchar' })
  scheduleExpression!: string;

  /**
   * Identificador asociado a timezone concept.
   */
  @Property({ fieldName: 'timezone_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  timezoneConceptId?: string;

  /**
   * Valor de lookback days mantenido por la instancia.
   */
  @Property({ fieldName: 'lookback_days', columnType: 'int', nullable: true })
  lookbackDays?: number;

  /**
   * Valor de freshness ttl seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'freshness_ttl_seconds',
    columnType: 'int',
    nullable: true,
  })
  freshnessTtlSeconds?: number;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRunAt?: Date;

  /**
   * Valor de last success at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_success_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
