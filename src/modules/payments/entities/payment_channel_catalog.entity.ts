import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_channel_catalog' })
export class PaymentChannelCatalog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'channel_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelTypeConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'supports_qr', type: 'boolean', nullable: true })
  supportsQr?: boolean;

  @Property({ fieldName: 'supports_card', type: 'boolean', nullable: true })
  supportsCard?: boolean;

  @Property({
    fieldName: 'supports_bank_transfer',
    type: 'boolean',
    nullable: true,
  })
  supportsBankTransfer?: boolean;

  @Property({ fieldName: 'supports_cash', type: 'boolean', nullable: true })
  supportsCash?: boolean;

  @Property({
    fieldName: 'requires_payer_identity',
    type: 'boolean',
    nullable: true,
  })
  requiresPayerIdentity?: boolean;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
