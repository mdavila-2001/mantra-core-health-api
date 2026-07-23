import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_mandates' })
export class PaymentMandates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'payer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  payerTypeConceptId!: string;

  @Property({ fieldName: 'payer_ref_id', type: 'uuid' })
  payerRefId!: string;

  @Property({ fieldName: 'mandate_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  mandateTypeConceptId!: string;

  @Property({ fieldName: 'payment_method_id', type: 'uuid', nullable: true }) // FK → payments.payment_methods
  paymentMethodId?: string;

  @Property({ fieldName: 'mandate_ref', columnType: 'varchar' })
  mandateRef!: string;

  @Property({ fieldName: 'scheme_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  schemeConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
