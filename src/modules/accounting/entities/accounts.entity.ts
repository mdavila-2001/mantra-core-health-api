import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `accounts`.
 */
@Entity({ schema: 'accounting', tableName: 'accounts' })
export class Accounts {
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
   * Identificador asociado a account group.
   */
  @Property({ fieldName: 'account_group_id', type: 'uuid', nullable: true }) // FK → accounting.account_groups
  accountGroupId?: string;

  /**
   * Identificador asociado a account type concept.
   */
  @Property({ fieldName: 'account_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountTypeConceptId!: string;

  /**
   * Identificador asociado a normal balance concept.
   */
  @Property({ fieldName: 'normal_balance_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  normalBalanceConceptId!: string;

  /**
   * Identificador asociado a parent account.
   */
  @Property({ fieldName: 'parent_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  parentAccountId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de is configurable mantenido por la instancia.
   */
  @Property({ fieldName: 'is_configurable', type: 'boolean' })
  isConfigurable!: boolean;

  /**
   * Valor de is system mantenido por la instancia.
   */
  @Property({ fieldName: 'is_system', type: 'boolean', nullable: true })
  isSystem?: boolean;

  /**
   * Valor de is postable mantenido por la instancia.
   */
  @Property({ fieldName: 'is_postable', type: 'boolean' })
  isPostable!: boolean;

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
