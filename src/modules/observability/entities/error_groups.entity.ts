import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `error_groups`.
 */
@Entity({ schema: 'observability', tableName: 'error_groups' })
export class ErrorGroups {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de fingerprint mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(64)' })
  fingerprint!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  source!: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar' })
  errorCode!: string;

  /**
   * Valor de error reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'error_reason',
    columnType: 'varchar',
    nullable: true,
  })
  errorReason?: string;

  /**
   * Valor de exception type mantenido por la instancia.
   */
  @Property({
    fieldName: 'exception_type',
    columnType: 'varchar',
    nullable: true,
  })
  exceptionType?: string;

  /**
   * Valor de module code mantenido por la instancia.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  /**
   * Valor de operation key mantenido por la instancia.
   */
  @Property({
    fieldName: 'operation_key',
    columnType: 'varchar',
    nullable: true,
  })
  operationKey?: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @Property({ fieldName: 'http_method', columnType: 'varchar', nullable: true })
  httpMethod?: string;

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
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de sample message mantenido por la instancia.
   */
  @Property({ fieldName: 'sample_message', columnType: 'text', nullable: true })
  sampleMessage?: string;

  /**
   * Valor de sample frames json mantenido por la instancia.
   */
  @Property({
    fieldName: 'sample_frames_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sampleFramesJson?: unknown;

  /**
   * Valor de first seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

  /**
   * Valor de occurrences total mantenido por la instancia.
   */
  @Property({ fieldName: 'occurrences_total', type: 'bigint' })
  occurrencesTotal!: string;

  /**
   * Valor de occurrences24h mantenido por la instancia.
   */
  @Property({ fieldName: 'occurrences_24h', type: 'bigint' })
  occurrences24h!: string;

  /**
   * Valor de affected actors24h mantenido por la instancia.
   */
  @Property({
    fieldName: 'affected_actors_24h',
    columnType: 'int',
    nullable: true,
  })
  affectedActors24h?: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  stateConceptId!: string;

  /**
   * Identificador asociado a assigned to user.
   */
  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  assignedToUserId?: string;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  /**
   * Identificador asociado a resolved by user.
   */
  @Property({ fieldName: 'resolved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  resolvedByUserId?: string;

  /**
   * Valor de resolution note mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolution_note',
    columnType: 'text',
    nullable: true,
  })
  resolutionNote?: string;

  /**
   * Valor de regressed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'regressed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  regressedAt?: Date;

  /**
   * Identificador asociado a last request.
   */
  @Property({
    fieldName: 'last_request_id',
    columnType: 'varchar',
    nullable: true,
  })
  lastRequestId?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
