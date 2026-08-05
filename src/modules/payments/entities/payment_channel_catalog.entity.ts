import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_channel_catalog`.
 */
@Entity({ schema: 'payments', tableName: 'payment_channel_catalog' })
export class PaymentChannelCatalog {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

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
   * Identificador asociado a channel type concept.
   */
  @Property({ fieldName: 'channel_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelTypeConceptId!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Valor de supports qr mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_qr', type: 'boolean', nullable: true })
  supportsQr?: boolean;

  /**
   * Valor de supports card mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_card', type: 'boolean', nullable: true })
  supportsCard?: boolean;

  /**
   * Valor de supports bank transfer mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_bank_transfer',
    type: 'boolean',
    nullable: true,
  })
  supportsBankTransfer?: boolean;

  /**
   * Valor de supports cash mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_cash', type: 'boolean', nullable: true })
  supportsCash?: boolean;

  /**
   * Valor de requires payer identity mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_payer_identity',
    type: 'boolean',
    nullable: true,
  })
  requiresPayerIdentity?: boolean;

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
