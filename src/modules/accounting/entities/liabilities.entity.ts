import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `liabilities`.
 */
@Entity({ schema: 'accounting', tableName: 'liabilities' })
export class Liabilities {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

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
   * Identificador asociado a liability type concept.
   */
  @Property({
    fieldName: 'liability_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  liabilityTypeConceptId?: string;

  /**
   * Identificador asociado a account.
   */
  @Property({ fieldName: 'account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  accountId?: string;

  /**
   * Valor de principal amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'principal_amount',
    columnType: 'numeric',
    nullable: true,
  })
  principalAmount?: string;

  /**
   * Valor de outstanding amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'outstanding_amount',
    columnType: 'numeric',
    nullable: true,
  })
  outstandingAmount?: string;

  /**
   * Valor de interest rate mantenido por la instancia.
   */
  @Property({
    fieldName: 'interest_rate',
    columnType: 'numeric',
    nullable: true,
  })
  interestRate?: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @Property({ fieldName: 'start_date', columnType: 'date', nullable: true })
  startDate?: Date;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  /**
   * Valor de creditor name mantenido por la instancia.
   */
  @Property({
    fieldName: 'creditor_name',
    columnType: 'varchar',
    nullable: true,
  })
  creditorName?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Si un worker programado puede pagar sus cuotas solo (FT-26), o si sólo
   * avanza cuando alguien llama al auto-servicio a mano.
   */
  @Property({ fieldName: 'automated', columnType: 'boolean' })
  automated: boolean = true;

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
