import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `time_off_requests`.
 */
@Entity({ schema: 'erp', tableName: 'time_off_requests' })
export class TimeOffRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a employee.
   */
  @Property({ fieldName: 'employee_id', type: 'uuid' }) // FK → erp.employees
  employeeId!: string;

  /**
   * Identificador asociado a leave type concept.
   */
  @Property({ fieldName: 'leave_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leaveTypeConceptId!: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @Property({ fieldName: 'start_date', columnType: 'date' })
  startDate!: Date;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @Property({ fieldName: 'end_date', columnType: 'date' })
  endDate!: Date;

  /**
   * Valor de hours mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  hours?: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  /**
   * Identificador asociado a approver user.
   */
  @Property({ fieldName: 'approver_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approverUserId?: string;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

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
