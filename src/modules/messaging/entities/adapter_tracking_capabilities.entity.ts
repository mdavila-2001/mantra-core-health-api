import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `adapter_tracking_capabilities`.
 */
@Entity({ schema: 'messaging', tableName: 'adapter_tracking_capabilities' })
export class AdapterTrackingCapabilities {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → messaging.messaging_providers
  providerId!: string;

  /**
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Identificador asociado a canonical event type concept.
   */
  @Property({ fieldName: 'canonical_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalEventTypeConceptId!: string;

  /**
   * Identificador asociado a support level concept.
   */
  @Property({ fieldName: 'support_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  supportLevelConceptId!: string;

  /**
   * Identificador asociado a evidence source concept.
   */
  @Property({ fieldName: 'evidence_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceSourceConceptId!: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  notes?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
