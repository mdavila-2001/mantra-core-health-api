import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `unit_visit_requests`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'unit_visit_requests' })
export class UnitVisitRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a unit medical visitor.
   */
  @Property({ fieldName: 'unit_medical_visitor_id', type: 'uuid' }) // FK → diagnostic_units.unit_medical_visitors (inferida)
  unitMedicalVisitorId!: string;

  /**
   * Identificador asociado a diagnostic unit.
   */
  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_units (inferida)
  diagnosticUnitId!: string;

  /**
   * Identificador asociado a doctor user.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  doctorUserId!: string;

  /**
   * Identificador asociado a doctor tenant.
   */
  @Property({ fieldName: 'doctor_tenant_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  doctorTenantId?: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  reason!: string;

  /**
   * Valor de requested start at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_start_at', columnType: 'timestamptz' })
  requestedStartAt!: Date;

  /**
   * Valor de duration minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_minutes', columnType: 'int' })
  durationMinutes!: number;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @Property({ fieldName: 'time_zone', columnType: 'varchar' })
  timeZone!: string;

  /**
   * Identificador asociado a modality concept.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  modalityConceptId!: string;

  /**
   * Valor de location mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  location?: string;

  /**
   * Valor de attachments mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  attachments?: unknown;

  /**
   * Valor de observations mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  observations?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de proposed start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'proposed_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  proposedStartAt?: Date;

  /**
   * Valor de confirmed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'confirmed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  confirmedAt?: Date;

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
   * Identificador asociado a rescheduled from.
   */
  @Property({ fieldName: 'rescheduled_from_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  rescheduledFromId?: string;

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
