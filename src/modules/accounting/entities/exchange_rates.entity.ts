import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `exchange_rates`.
 */
@Entity({ schema: 'accounting', tableName: 'exchange_rates' })
export class ExchangeRates {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a from currency concept.
   */
  @Property({ fieldName: 'from_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromCurrencyConceptId!: string;

  /**
   * Identificador asociado a to currency concept.
   */
  @Property({ fieldName: 'to_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toCurrencyConceptId!: string;

  /**
   * Valor de rate mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  rate!: string;

  /**
   * Valor de valid on mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_on', columnType: 'date' })
  validOn!: Date;

  /**
   * Valor de source mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  source?: string;

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
