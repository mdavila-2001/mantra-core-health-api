import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_simple_records`.
 *
 * Un gasto, un activo o una deuda de la contabilidad simple del doctor (P49).
 * Su tipo ES una cuenta de la clase que corresponde al `kind`.
 */
@Entity({ schema: 'accounting', tableName: 'practitioner_simple_records' })
export class PractitionerSimpleRecords {
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
   * Qué es: EXPENSE (gasto), ASSET (activo) o DEBT (deuda).
   */
  @Property({ columnType: 'varchar' })
  kind!: string;

  /**
   * Fecha del registro.
   */
  @Property({ fieldName: 'record_date', columnType: 'date' })
  recordDate!: Date;

  /**
   * Identificador asociado a account (el tipo del registro).
   */
  @Property({ fieldName: 'account_id', type: 'uuid' }) // FK → accounting.practitioner_simple_accounts
  accountId!: string;

  /**
   * Descripción libre del registro.
   */
  @Property({ columnType: 'varchar' })
  description!: string;

  /**
   * Importe, siempre positivo.
   */
  @Property({ columnType: 'numeric' })
  amount!: string;

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
