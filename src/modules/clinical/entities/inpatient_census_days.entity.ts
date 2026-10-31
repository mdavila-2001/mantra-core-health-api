import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inpatient_census_days`.
 */
@Entity({ schema: 'clinical', tableName: 'inpatient_census_days' })
export class InpatientCensusDays {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @Property({ fieldName: 'clinical_unit_id', type: 'uuid' }) // FK → practice.clinical_units (inferida)
  clinicalUnitId!: string;

  /**
   * Valor de census date mantenido por la instancia.
   */
  @Property({ fieldName: 'census_date', columnType: 'date' })
  censusDate!: Date;

  /**
   * Valor de cutoff at mantenido por la instancia.
   */
  @Property({ fieldName: 'cutoff_at', columnType: 'timestamptz' })
  cutoffAt!: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de closed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  /**
   * Identificador asociado a closed by user.
   */
  @Property({ fieldName: 'closed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  closedByUserId?: string;

  /**
   * Valor de beds censable mantenido por la instancia.
   */
  @Property({ fieldName: 'beds_censable', columnType: 'int' })
  bedsCensable!: number;

  /**
   * Valor de beds available mantenido por la instancia.
   */
  @Property({ fieldName: 'beds_available', columnType: 'int' })
  bedsAvailable!: number;

  /**
   * Valor de beds blocked mantenido por la instancia.
   */
  @Property({ fieldName: 'beds_blocked', columnType: 'int' })
  bedsBlocked!: number;

  /**
   * Valor de patients at cutoff mantenido por la instancia.
   */
  @Property({ fieldName: 'patients_at_cutoff', columnType: 'int' })
  patientsAtCutoff!: number;

  /**
   * Valor de admissions mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  admissions!: number;

  /**
   * Valor de discharges mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  discharges!: number;

  /**
   * Valor de deaths mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  deaths!: number;

  /**
   * Valor de transfers in mantenido por la instancia.
   */
  @Property({ fieldName: 'transfers_in', columnType: 'int' })
  transfersIn!: number;

  /**
   * Valor de transfers out mantenido por la instancia.
   */
  @Property({ fieldName: 'transfers_out', columnType: 'int' })
  transfersOut!: number;

  /**
   * Valor de same day stays mantenido por la instancia.
   */
  @Property({ fieldName: 'same_day_stays', columnType: 'int' })
  sameDayStays!: number;

  /**
   * Valor de patient days mantenido por la instancia.
   */
  @Property({ fieldName: 'patient_days', columnType: 'int' })
  patientDays!: number;

  /**
   * Valor de discharge stay days mantenido por la instancia.
   */
  @Property({ fieldName: 'discharge_stay_days', columnType: 'int' })
  dischargeStayDays!: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
