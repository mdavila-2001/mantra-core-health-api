import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_simple_accounts`.
 *
 * Una cuenta de la contabilidad simple del doctor (P49). Cada práctica tiene
 * las suyas: las 26 generales se siembran por práctica (`seeded = true`) y el
 * doctor suma las propias.
 */
@Entity({ schema: 'accounting', tableName: 'practitioner_simple_accounts' })
export class PractitionerSimpleAccounts {
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
   * Código corto de la cuenta (`5.3`); lo asigna el servidor.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Nombre de la cuenta.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Clase de la cuenta: ASSET, LIABILITY, EQUITY, INCOME o EXPENSE.
   */
  @Property({ fieldName: 'account_class', columnType: 'varchar' })
  accountClass!: string;

  /**
   * Viene sembrada con la práctica: se renombra, no se borra.
   */
  @Property({ type: 'boolean' })
  seeded: boolean = false;

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
