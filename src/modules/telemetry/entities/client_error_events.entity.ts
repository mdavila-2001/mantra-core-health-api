import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'client_error_events' })
export class ClientErrorEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts (inferida)
  portalTypeConceptId!: string;

  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true })
  actorTenantId?: string;

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true })  // FK → iam.users (inferida)
  userId?: string;

  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true })  // FK → iam.sessions (inferida)
  sessionId?: string;

  @Property({ fieldName: 'route_template', columnType: 'varchar(300)', nullable: true })
  routeTemplate?: string;

  @Property({ columnType: 'varchar(32)' })
  fingerprint!: string;

  @Property({ fieldName: 'error_class_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts (inferida)
  errorClassConceptId!: string;

  @Property({ fieldName: 'error_type', columnType: 'varchar(120)' })
  errorType!: string;

  @Property({ fieldName: 'sanitized_message', columnType: 'varchar(500)', nullable: true })
  sanitizedMessage?: string;

  @Property({ fieldName: 'http_method', columnType: 'varchar(8)', nullable: true })
  httpMethod?: string;

  @Property({ fieldName: 'api_route_template', columnType: 'varchar(300)', nullable: true })
  apiRouteTemplate?: string;

  @Property({ fieldName: 'http_status', columnType: 'smallint', nullable: true })
  httpStatus?: number;

  @Property({ fieldName: 'api_error_code', columnType: 'varchar(60)', nullable: true })
  apiErrorCode?: string;

  @Property({ fieldName: 'request_id', columnType: 'varchar(80)', nullable: true })
  requestId?: string;

  @Property({ fieldName: 'support_code', columnType: 'varchar(40)', nullable: true })
  supportCode?: string;

  @Property({ fieldName: 'app_version', columnType: 'varchar(40)' })
  appVersion!: string;

  @Property({ fieldName: 'build_id', columnType: 'varchar(40)', nullable: true })
  buildId?: string;

  @Property({ fieldName: 'screen_size', columnType: 'varchar(12)', nullable: true })
  screenSize?: string;

  @Property({ fieldName: 'is_online', type: 'boolean', nullable: true })
  isOnline?: boolean;

  @Property({ fieldName: 'suppressed_count', columnType: 'int', default: 0 })
  suppressedCount!: number;

}
