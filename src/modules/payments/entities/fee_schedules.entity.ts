import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `fee_schedules`.
 */
@Entity({ schema: 'payments', tableName: 'fee_schedules' })
export class FeeSchedules {
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
   * Identificador asociado a fee type concept.
   */
  @Property({ fieldName: 'fee_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  feeTypeConceptId!: string;

  /**
   * Identificador asociado a calculation method concept.
   */
  @Property({ fieldName: 'calculation_method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  calculationMethodConceptId!: string;

  /**
   * Valor de percentage mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  percentage?: string;

  /**
   * Valor de fixed amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'fixed_amount',
    columnType: 'numeric',
    nullable: true,
  })
  fixedAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de min amount mantenido por la instancia.
   */
  @Property({ fieldName: 'min_amount', columnType: 'numeric', nullable: true })
  minAmount?: string;

  /**
   * Valor de max amount mantenido por la instancia.
   */
  @Property({ fieldName: 'max_amount', columnType: 'numeric', nullable: true })
  maxAmount?: string;

  /**
   * Identificador asociado a applies to concept.
   */
  @Property({
    fieldName: 'applies_to_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  appliesToConceptId?: string;

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
