import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'artifacts' })
export class Artifacts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid', nullable: true }) // FK → platform_ops.service_components
  serviceComponentId?: string;

  @Property({ fieldName: 'produced_by_tool_id', type: 'uuid', nullable: true }) // FK → platform_ops.tool_registry
  producedByToolId?: string;

  @Property({ fieldName: 'artifact_ref', columnType: 'varchar' })
  artifactRef!: string;

  @Property({ fieldName: 'artifact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  artifactTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ columnType: 'varchar', nullable: true })
  version?: string;

  @Property({ columnType: 'varchar', nullable: true })
  semver?: string;

  @Property({ fieldName: 'git_ref', columnType: 'varchar', nullable: true })
  gitRef?: string;

  @Property({ fieldName: 'commit_sha', columnType: 'varchar', nullable: true })
  commitSha?: string;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({ fieldName: 'storage_uri', columnType: 'text', nullable: true })
  storageUri?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({ fieldName: 'size_bytes', columnType: 'int', nullable: true })
  sizeBytes?: number;

  @Property({ fieldName: 'is_immutable', type: 'boolean', nullable: true })
  isImmutable?: boolean;

  @Property({
    fieldName: 'built_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  builtAt?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
