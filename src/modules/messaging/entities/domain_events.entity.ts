import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `domain_events`.
 */
@Entity({ schema: 'messaging', tableName: 'domain_events' })
export class DomainEvents {
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
   * Valor de event type mantenido por la instancia.
   */
  @Property({ fieldName: 'event_type', columnType: 'varchar' })
  eventType!: string;

  /**
   * Valor de event version mantenido por la instancia.
   */
  @Property({ fieldName: 'event_version', columnType: 'int' })
  eventVersion!: number;

  /**
   * Valor de aggregate type mantenido por la instancia.
   */
  @Property({ fieldName: 'aggregate_type', columnType: 'varchar' })
  aggregateType!: string;

  /**
   * Identificador asociado a aggregate.
   */
  @Property({ fieldName: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', columnType: 'varchar' })
  correlationId!: string;

  /**
   * Identificador asociado a causation.
   */
  @Property({ fieldName: 'causation_id', type: 'uuid', nullable: true }) // FK → messaging.domain_events
  causationId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
