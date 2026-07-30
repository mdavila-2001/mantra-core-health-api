import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `liability_schedules`.
 */
@Entity({ schema: 'accounting', tableName: 'liability_schedules' })
export class LiabilitySchedules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a liability.
   */
  @Property({ fieldName: 'liability_id', type: 'uuid' }) // FK → accounting.liabilities
  liabilityId!: string;

  /**
   * Valor de installment number mantenido por la instancia.
   */
  @Property({ fieldName: 'installment_number', columnType: 'int' })
  installmentNumber!: number;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  /**
   * Valor de principal due mantenido por la instancia.
   */
  @Property({
    fieldName: 'principal_due',
    columnType: 'numeric',
    nullable: true,
  })
  principalDue?: string;

  /**
   * Valor de interest due mantenido por la instancia.
   */
  @Property({
    fieldName: 'interest_due',
    columnType: 'numeric',
    nullable: true,
  })
  interestDue?: string;

  /**
   * Valor de fee due mantenido por la instancia.
   */
  @Property({ fieldName: 'fee_due', columnType: 'numeric', nullable: true })
  feeDue?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de paid amount mantenido por la instancia.
   */
  @Property({ fieldName: 'paid_amount', columnType: 'numeric', nullable: true })
  paidAmount?: string;

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
