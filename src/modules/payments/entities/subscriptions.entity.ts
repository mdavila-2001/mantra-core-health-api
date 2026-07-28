import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `subscriptions`.
 */
@Entity({ schema: 'payments', tableName: 'subscriptions' })
export class Subscriptions {
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
   * Identificador asociado a plan.
   */
  @Property({ fieldName: 'plan_id', type: 'uuid' }) // FK → payments.subscription_plans
  planId!: string;

  /**
   * Identificador asociado a subscriber type concept.
   */
  @Property({ fieldName: 'subscriber_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subscriberTypeConceptId!: string;

  /**
   * Identificador asociado a subscriber ref.
   */
  @Property({ fieldName: 'subscriber_ref_id', type: 'uuid' })
  subscriberRefId!: string;

  /**
   * Identificador asociado a payment method.
   */
  @Property({ fieldName: 'payment_method_id', type: 'uuid', nullable: true }) // FK → payments.payment_methods
  paymentMethodId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de current period start mantenido por la instancia.
   */
  @Property({
    fieldName: 'current_period_start',
    columnType: 'timestamptz',
    nullable: true,
  })
  currentPeriodStart?: Date;

  /**
   * Valor de current period end mantenido por la instancia.
   */
  @Property({
    fieldName: 'current_period_end',
    columnType: 'timestamptz',
    nullable: true,
  })
  currentPeriodEnd?: Date;

  /**
   * Valor de trial end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'trial_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  trialEndAt?: Date;

  /**
   * Valor de cancel at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancel_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelAt?: Date;

  /**
   * Valor de canceled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'canceled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  canceledAt?: Date;

  /**
   * Identificador asociado a mandate.
   */
  @Property({ fieldName: 'mandate_id', type: 'uuid', nullable: true }) // FK → payments.payment_mandates
  mandateId?: string;

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
