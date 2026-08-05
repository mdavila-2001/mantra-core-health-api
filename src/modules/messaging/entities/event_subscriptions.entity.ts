import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `event_subscriptions`.
 */
@Entity({ schema: 'messaging', tableName: 'event_subscriptions' })
export class EventSubscriptions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de subscriber code mantenido por la instancia.
   */
  @Property({ fieldName: 'subscriber_code', columnType: 'varchar' })
  subscriberCode!: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @Property({ fieldName: 'event_type', columnType: 'varchar' })
  eventType!: string;

  /**
   * Valor de event version mantenido por la instancia.
   */
  @Property({ fieldName: 'event_version', columnType: 'int', nullable: true })
  eventVersion?: number;

  /**
   * Identificador asociado a delivery mode concept.
   */
  @Property({ fieldName: 'delivery_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  deliveryModeConceptId!: string;

  /**
   * Valor de target queue mantenido por la instancia.
   */
  @Property({
    fieldName: 'target_queue',
    columnType: 'varchar',
    nullable: true,
  })
  targetQueue?: string;

  /**
   * Valor de filter json mantenido por la instancia.
   */
  @Property({
    fieldName: 'filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filterJson?: unknown;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
