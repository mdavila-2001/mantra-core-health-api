import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `loyalty_programs`.
 */
@Entity({ schema: 'promotions', tableName: 'loyalty_programs' })
export class LoyaltyPrograms {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

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
   * Identificador asociado a program type concept.
   */
  @Property({ fieldName: 'program_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  programTypeConceptId!: string;

  /**
   * Valor de points currency name mantenido por la instancia.
   */
  @Property({
    fieldName: 'points_currency_name',
    columnType: 'varchar',
    nullable: true,
  })
  pointsCurrencyName?: string;

  /**
   * Valor de point to currency rate mantenido por la instancia.
   */
  @Property({
    fieldName: 'point_to_currency_rate',
    columnType: 'numeric',
    nullable: true,
  })
  pointToCurrencyRate?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a expiry policy concept.
   */
  @Property({
    fieldName: 'expiry_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  expiryPolicyConceptId?: string;

  /**
   * Valor de points expiry days mantenido por la instancia.
   */
  @Property({
    fieldName: 'points_expiry_days',
    columnType: 'int',
    nullable: true,
  })
  pointsExpiryDays?: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
