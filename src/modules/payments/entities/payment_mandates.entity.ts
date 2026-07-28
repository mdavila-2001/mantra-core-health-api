import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_mandates`.
 */
@Entity({ schema: 'payments', tableName: 'payment_mandates' })
export class PaymentMandates {
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
   * Identificador asociado a payer type concept.
   */
  @Property({ fieldName: 'payer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  payerTypeConceptId!: string;

  /**
   * Identificador asociado a payer ref.
   */
  @Property({ fieldName: 'payer_ref_id', type: 'uuid' })
  payerRefId!: string;

  /**
   * Identificador asociado a mandate type concept.
   */
  @Property({ fieldName: 'mandate_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  mandateTypeConceptId!: string;

  /**
   * Identificador asociado a payment method.
   */
  @Property({ fieldName: 'payment_method_id', type: 'uuid', nullable: true }) // FK → payments.payment_methods
  paymentMethodId?: string;

  /**
   * Valor de mandate ref mantenido por la instancia.
   */
  @Property({ fieldName: 'mandate_ref', columnType: 'varchar' })
  mandateRef!: string;

  /**
   * Identificador asociado a scheme concept.
   */
  @Property({ fieldName: 'scheme_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  schemeConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  /**
   * Valor de revoked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

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
