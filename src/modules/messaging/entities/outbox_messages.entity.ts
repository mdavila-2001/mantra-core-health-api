import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `outbox_messages`.
 */
@Entity({ schema: 'messaging', tableName: 'outbox_messages' })
export class OutboxMessages {
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
   * Identificador asociado a domain event.
   */
  @Property({ fieldName: 'domain_event_id', type: 'uuid' }) // FK → messaging.domain_events
  domainEventId!: string;

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
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de available at mantenido por la instancia.
   */
  @Property({
    fieldName: 'available_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  availableAt?: Date;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  /**
   * Valor de attempts mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  attempts!: number;

  /**
   * Valor de max attempts mantenido por la instancia.
   */
  @Property({ fieldName: 'max_attempts', columnType: 'int' })
  maxAttempts!: number;

  /**
   * Valor de locked by mantenido por la instancia.
   */
  @Property({ fieldName: 'locked_by', columnType: 'varchar', nullable: true })
  lockedBy?: string;

  /**
   * Valor de lock expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'lock_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockExpiresAt?: Date;

  /**
   * Valor de last error text mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_error_text',
    columnType: 'text',
    nullable: true,
  })
  lastErrorText?: string;

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
