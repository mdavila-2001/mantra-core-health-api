import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_catalog`.
 */
@Entity({ schema: 'billing', tableName: 'service_catalog' })
export class ServiceCatalog {
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
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  /**
   * Valor de default price mantenido por la instancia.
   */
  @Property({ fieldName: 'default_price', columnType: 'numeric' })
  defaultPrice!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a tax code.
   */
  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  /**
   * Identificador asociado a income account.
   */
  @Property({ fieldName: 'income_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  incomeAccountId?: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
