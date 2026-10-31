import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'observability', tableName: 'error_groups' })
export class ErrorGroups {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar(64)' })
  fingerprint!: string;

  @Property({ columnType: 'varchar' })
  source!: string;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  @Property({ fieldName: 'error_code', columnType: 'varchar' })
  errorCode!: string;

  @Property({
    fieldName: 'error_reason',
    columnType: 'varchar',
    nullable: true,
  })
  errorReason?: string;

  @Property({
    fieldName: 'exception_type',
    columnType: 'varchar',
    nullable: true,
  })
  exceptionType?: string;

  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  @Property({
    fieldName: 'operation_key',
    columnType: 'varchar',
    nullable: true,
  })
  operationKey?: string;

  @Property({ fieldName: 'http_method', columnType: 'varchar', nullable: true })
  httpMethod?: string;

  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'sample_message', columnType: 'text', nullable: true })
  sampleMessage?: string;

  @Property({
    fieldName: 'sample_frames_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sampleFramesJson?: unknown;

  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  @Property({ fieldName: 'last_seen_at', columnType: 'timestamptz' })
  lastSeenAt!: Date;

  @Property({ fieldName: 'occurrences_total', type: 'bigint' })
  occurrencesTotal!: string;

  @Property({ fieldName: 'occurrences_24h', type: 'bigint' })
  occurrences24h!: string;

  @Property({
    fieldName: 'affected_actors_24h',
    columnType: 'int',
    nullable: true,
  })
  affectedActors24h?: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  stateConceptId!: string;

  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  assignedToUserId?: string;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({ fieldName: 'resolved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  resolvedByUserId?: string;

  @Property({
    fieldName: 'resolution_note',
    columnType: 'text',
    nullable: true,
  })
  resolutionNote?: string;

  @Property({
    fieldName: 'regressed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  regressedAt?: Date;

  @Property({
    fieldName: 'last_request_id',
    columnType: 'varchar',
    nullable: true,
  })
  lastRequestId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
