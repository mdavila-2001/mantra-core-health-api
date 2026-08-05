import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `employee_payments`.
 */
@Entity({ schema: 'accounting', tableName: 'employee_payments' })
export class EmployeePayments {
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
   * Identificador asociado a fiscal period.
   */
  @Property({ fieldName: 'fiscal_period_id', type: 'uuid', nullable: true }) // FK → accounting.fiscal_periods
  fiscalPeriodId?: string;

  /**
   * Identificador asociado a transaction.
   */
  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK → accounting.journal_transactions
  transactionId?: string;

  /**
   * Valor de gross amount mantenido por la instancia.
   */
  @Property({ fieldName: 'gross_amount', columnType: 'numeric' })
  grossAmount!: string;

  /**
   * Valor de deductions mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  deductions?: string;

  /**
   * Valor de net amount mantenido por la instancia.
   */
  @Property({ fieldName: 'net_amount', columnType: 'numeric', nullable: true })
  netAmount?: string;

  /**
   * Valor de paid at mantenido por la instancia.
   */
  @Property({ fieldName: 'paid_at', columnType: 'timestamptz', nullable: true })
  paidAt?: Date;

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
