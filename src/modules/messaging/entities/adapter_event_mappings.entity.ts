import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `adapter_event_mappings`.
 */
@Entity({ schema: 'messaging', tableName: 'adapter_event_mappings' })
export class AdapterEventMappings {
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
   * Valor de mapping version mantenido por la instancia.
   */
  @Property({ fieldName: 'mapping_version', columnType: 'int' })
  mappingVersion!: number;

  /**
   * Valor de external event code mantenido por la instancia.
   */
  @Property({ fieldName: 'external_event_code', columnType: 'varchar' })
  externalEventCode!: string;

  /**
   * Identificador asociado a canonical event type concept.
   */
  @Property({ fieldName: 'canonical_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalEventTypeConceptId!: string;

  /**
   * Identificador asociado a canonical delivery status concept.
   */
  @Property({ fieldName: 'canonical_delivery_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalDeliveryStatusConceptId!: string;

  /**
   * Valor de terminal mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  terminal!: boolean;

  /**
   * Valor de success mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  success?: boolean;

  /**
   * Valor de precedence mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  precedence!: number;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
