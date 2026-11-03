import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `unit_visit_records`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'unit_visit_records' })
export class UnitVisitRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a unit visit request.
   */
  @Property({ fieldName: 'unit_visit_request_id', type: 'uuid' }) // FK → diagnostic_units.unit_visit_requests (inferida)
  unitVisitRequestId!: string;

  /**
   * Identificador asociado a doctor user.
   */
  @Property({ fieldName: 'doctor_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  doctorUserId!: string;

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
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Valor de location mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  location?: string;

  /**
   * Identificador asociado a modality concept.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  modalityConceptId!: string;

  /**
   * Valor de topics discussed mantenido por la instancia.
   */
  @Property({
    fieldName: 'topics_discussed',
    columnType: 'text',
    nullable: true,
  })
  topicsDiscussed?: string;

  /**
   * Valor de questions mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  questions?: string;

  /**
   * Valor de commitments mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  commitments?: string;

  /**
   * Valor de next action mantenido por la instancia.
   */
  @Property({ fieldName: 'next_action', columnType: 'text', nullable: true })
  nextAction?: string;

  /**
   * Valor de observations mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  observations?: string;

  /**
   * Identificador asociado a visitor attendance concept.
   */
  @Property({ fieldName: 'visitor_attendance_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  visitorAttendanceConceptId!: string;

  /**
   * Identificador asociado a doctor attendance concept.
   */
  @Property({ fieldName: 'doctor_attendance_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  doctorAttendanceConceptId!: string;

  /**
   * Identificador asociado a confirmation concept.
   */
  @Property({ fieldName: 'confirmation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  confirmationConceptId!: string;

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
