import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `earning_rules`.
 */
@Entity({ schema: 'promotions', tableName: 'earning_rules' })
export class EarningRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a loyalty program.
   */
  @Property({ fieldName: 'loyalty_program_id', type: 'uuid' }) // FK → promotions.loyalty_programs
  loyaltyProgramId!: string;

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
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a award type concept.
   */
  @Property({ fieldName: 'award_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  awardTypeConceptId!: string;

  /**
   * Valor de points amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'points_amount',
    columnType: 'numeric',
    nullable: true,
  })
  pointsAmount?: string;

  /**
   * Valor de credit amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'credit_amount',
    columnType: 'numeric',
    nullable: true,
  })
  creditAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /**
   * Valor de cap per period mantenido por la instancia.
   */
  @Property({ fieldName: 'cap_per_period', columnType: 'int', nullable: true })
  capPerPeriod?: number;

  /**
   * Identificador asociado a period concept.
   */
  @Property({ fieldName: 'period_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  periodConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
