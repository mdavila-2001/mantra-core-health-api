import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `user_activity_events`.
 */
@Entity({ schema: 'telemetry', tableName: 'user_activity_events' })
export class UserActivityEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a event schema definition.
   */
  @Property({ fieldName: 'event_schema_definition_id', type: 'uuid' }) // FK → telemetry.activity_event_schema_definitions
  eventSchemaDefinitionId!: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @Property({ fieldName: 'analytics_subject_id', type: 'uuid', nullable: true }) // FK → telemetry.analytics_subjects
  analyticsSubjectId?: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  /**
   * Identificador asociado a session.
   */
  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true }) // FK → iam.sessions
  sessionId?: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Valor de event idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'event_idempotency_key', columnType: 'varchar' })
  eventIdempotencyKey!: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({
    fieldName: 'target_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  targetTypeConceptId?: string;

  /**
   * Identificador asociado a target entity.
   */
  @Property({ fieldName: 'target_entity_id', type: 'uuid', nullable: true })
  targetEntityId?: string;

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
   * Valor de received at mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  /**
   * Identificador asociado a consent snapshot.
   */
  @Property({ fieldName: 'consent_snapshot_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentSnapshotId?: string;

  /**
   * Identificador asociado a security audit event.
   */
  @Property({
    fieldName: 'security_audit_event_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.security_events
  securityAuditEventId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
