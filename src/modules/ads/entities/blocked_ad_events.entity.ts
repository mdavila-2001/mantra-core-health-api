import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `blocked_ad_events`.
 */
@Entity({ schema: 'ads', tableName: 'blocked_ad_events' })
export class BlockedAdEvents {
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
   * Identificador asociado a ad event data policy.
   */
  @Property({ fieldName: 'ad_event_data_policy_id', type: 'uuid' }) // FK → ads.ad_event_data_policies
  adEventDataPolicyId!: string;

  /**
   * Valor de source event reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_event_reference',
    columnType: 'varchar',
    nullable: true,
  })
  sourceEventReference?: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Valor de blocked at mantenido por la instancia.
   */
  @Property({ fieldName: 'blocked_at', columnType: 'timestamptz' })
  blockedAt!: Date;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  /**
   * Valor de blocked field paths json mantenido por la instancia.
   */
  @Property({
    fieldName: 'blocked_field_paths_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  blockedFieldPathsJson?: unknown;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'payload_hash',
    columnType: 'varchar',
    nullable: true,
  })
  payloadHash?: string;

  /**
   * Identificador asociado a review status concept.
   */
  @Property({
    fieldName: 'review_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reviewStatusConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
