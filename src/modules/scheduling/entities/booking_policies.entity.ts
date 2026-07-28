import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `booking_policies`.
 */
@Entity({ schema: 'scheduling', tableName: 'booking_policies' })
export class BookingPolicies {
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
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de min notice minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'min_notice_minutes',
    columnType: 'int',
    nullable: true,
  })
  minNoticeMinutes?: number;

  /**
   * Valor de max advance days mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_advance_days',
    columnType: 'int',
    nullable: true,
  })
  maxAdvanceDays?: number;

  /**
   * Valor de cancellation window minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancellation_window_minutes',
    columnType: 'int',
    nullable: true,
  })
  cancellationWindowMinutes?: number;

  /**
   * Valor de no show fee amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'no_show_fee_amount',
    columnType: 'numeric',
    nullable: true,
  })
  noShowFeeAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de allow overbooking mantenido por la instancia.
   */
  @Property({ fieldName: 'allow_overbooking', type: 'boolean', nullable: true })
  allowOverbooking?: boolean;

  /**
   * Valor de max active per patient mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_active_per_patient',
    columnType: 'int',
    nullable: true,
  })
  maxActivePerPatient?: number;

  /**
   * Valor de hold ttl seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'hold_ttl_seconds',
    columnType: 'int',
    nullable: true,
  })
  holdTtlSeconds?: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
