import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `subscription_plans`.
 */
@Entity({ schema: 'payments', tableName: 'subscription_plans' })
export class SubscriptionPlans {
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
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

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
   * Identificador asociado a tier concept.
   */
  @Property({ fieldName: 'tier_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  tierConceptId!: string;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @Property({ fieldName: 'is_default', type: 'boolean', nullable: true })
  isDefault?: boolean;

  /**
   * Valor de is public mantenido por la instancia.
   */
  @Property({ fieldName: 'is_public', type: 'boolean', nullable: true })
  isPublic?: boolean;

  /**
   * Identificador asociado a billing interval concept.
   */
  @Property({ fieldName: 'billing_interval_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  billingIntervalConceptId!: string;

  /**
   * Valor de interval count mantenido por la instancia.
   */
  @Property({ fieldName: 'interval_count', columnType: 'int', nullable: true })
  intervalCount?: number;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  amount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  /**
   * Valor de trial days mantenido por la instancia.
   */
  @Property({ fieldName: 'trial_days', columnType: 'int', nullable: true })
  trialDays?: number;

  /**
   * Valor de setup fee mantenido por la instancia.
   */
  @Property({ fieldName: 'setup_fee', columnType: 'numeric', nullable: true })
  setupFee?: string;

  /**
   * Identificador asociado a usage type concept.
   */
  @Property({
    fieldName: 'usage_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  usageTypeConceptId?: string;

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
