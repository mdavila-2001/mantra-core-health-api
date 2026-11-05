import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `client_error_events`.
 */
@Entity({ schema: 'telemetry', tableName: 'client_error_events' })
export class ClientErrorEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Identificador asociado a portal type concept.
   */
  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  portalTypeConceptId!: string;

  /**
   * Identificador asociado a actor tenant.
   */
  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true })
  actorTenantId?: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  userId?: string;

  /**
   * Identificador asociado a session.
   */
  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true }) // FK → iam.sessions (inferida)
  sessionId?: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'route_template',
    columnType: 'varchar(300)',
    nullable: true,
  })
  routeTemplate?: string;

  /**
   * Valor de fingerprint mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(32)' })
  fingerprint!: string;

  /**
   * Identificador asociado a error class concept.
   */
  @Property({ fieldName: 'error_class_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  errorClassConceptId!: string;

  /**
   * Valor de error type mantenido por la instancia.
   */
  @Property({ fieldName: 'error_type', columnType: 'varchar(120)' })
  errorType!: string;

  /**
   * Valor de sanitized message mantenido por la instancia.
   */
  @Property({
    fieldName: 'sanitized_message',
    columnType: 'varchar(500)',
    nullable: true,
  })
  sanitizedMessage?: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @Property({
    fieldName: 'http_method',
    columnType: 'varchar(8)',
    nullable: true,
  })
  httpMethod?: string;

  /**
   * Valor de api route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'api_route_template',
    columnType: 'varchar(300)',
    nullable: true,
  })
  apiRouteTemplate?: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({
    fieldName: 'http_status',
    columnType: 'smallint',
    nullable: true,
  })
  httpStatus?: number;

  /**
   * Valor de api error code mantenido por la instancia.
   */
  @Property({
    fieldName: 'api_error_code',
    columnType: 'varchar(60)',
    nullable: true,
  })
  apiErrorCode?: string;

  /**
   * Identificador asociado a request.
   */
  @Property({
    fieldName: 'request_id',
    columnType: 'varchar(80)',
    nullable: true,
  })
  requestId?: string;

  /**
   * Valor de support code mantenido por la instancia.
   */
  @Property({
    fieldName: 'support_code',
    columnType: 'varchar(40)',
    nullable: true,
  })
  supportCode?: string;

  /**
   * Valor de app version mantenido por la instancia.
   */
  @Property({ fieldName: 'app_version', columnType: 'varchar(40)' })
  appVersion!: string;

  /**
   * Identificador asociado a build.
   */
  @Property({
    fieldName: 'build_id',
    columnType: 'varchar(40)',
    nullable: true,
  })
  buildId?: string;

  /**
   * Valor de screen size mantenido por la instancia.
   */
  @Property({
    fieldName: 'screen_size',
    columnType: 'varchar(12)',
    nullable: true,
  })
  screenSize?: string;

  /**
   * Valor de is online mantenido por la instancia.
   */
  @Property({ fieldName: 'is_online', type: 'boolean', nullable: true })
  isOnline?: boolean;

  /**
   * Valor de suppressed count mantenido por la instancia.
   */
  @Property({ fieldName: 'suppressed_count', columnType: 'int', default: 0 })
  suppressedCount!: number;
}
