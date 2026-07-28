import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_recurrence_rules`.
 */
@Entity({ schema: 'crm', tableName: 'crm_recurrence_rules' })
export class CrmRecurrenceRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a recurrence frequency concept.
   */
  @Property({ fieldName: 'recurrence_frequency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recurrenceFrequencyConceptId!: string;

  /**
   * Valor de interval count mantenido por la instancia.
   */
  @Property({ fieldName: 'interval_count', columnType: 'int', nullable: true })
  intervalCount?: number;

  /**
   * Valor de by day json mantenido por la instancia.
   */
  @Property({
    fieldName: 'by_day_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  byDayJson?: unknown;

  /**
   * Valor de count limit mantenido por la instancia.
   */
  @Property({ fieldName: 'count_limit', columnType: 'int', nullable: true })
  countLimit?: number;

  /**
   * Valor de until at mantenido por la instancia.
   */
  @Property({
    fieldName: 'until_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  untilAt?: Date;

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
