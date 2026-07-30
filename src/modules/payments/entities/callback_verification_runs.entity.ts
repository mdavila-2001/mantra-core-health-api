import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `callback_verification_runs`.
 */
@Entity({ schema: 'payments', tableName: 'callback_verification_runs' })
export class CallbackVerificationRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider callback event.
   */
  @Property({ fieldName: 'provider_callback_event_id', type: 'uuid' }) // FK → payments.provider_callback_events
  providerCallbackEventId!: string;

  /**
   * Identificador asociado a verification method concept.
   */
  @Property({ fieldName: 'verification_method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationMethodConceptId!: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de signature present mantenido por la instancia.
   */
  @Property({ fieldName: 'signature_present', type: 'boolean', nullable: true })
  signaturePresent?: boolean;

  /**
   * Valor de timestamp within window mantenido por la instancia.
   */
  @Property({
    fieldName: 'timestamp_within_window',
    type: 'boolean',
    nullable: true,
  })
  timestampWithinWindow?: boolean;

  /**
   * Valor de source network allowed mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_network_allowed',
    type: 'boolean',
    nullable: true,
  })
  sourceNetworkAllowed?: boolean;

  /**
   * Valor de status inquiry confirmed mantenido por la instancia.
   */
  @Property({
    fieldName: 'status_inquiry_confirmed',
    type: 'boolean',
    nullable: true,
  })
  statusInquiryConfirmed?: boolean;

  /**
   * Valor de failure reason mantenido por la instancia.
   */
  @Property({ fieldName: 'failure_reason', columnType: 'text', nullable: true })
  failureReason?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
