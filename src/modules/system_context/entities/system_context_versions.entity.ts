import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'system_context_versions' })
export class SystemContextVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'system_context_id', type: 'uuid' }) // FK → system_context.system_contexts
  systemContextId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'refresh_run_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  refreshRunId?: string;

  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  @Property({ fieldName: 'context_json', type: 'json', columnType: 'jsonb' })
  contextJson!: unknown;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({
    fieldName: 'generated_by_agent_id',
    type: 'uuid',
    nullable: true,
  }) // FK → automation.agents
  generatedByAgentId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
