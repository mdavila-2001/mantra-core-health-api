import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `artifacts`.
 */
@Entity({ schema: 'platform_ops', tableName: 'artifacts' })
export class Artifacts {
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
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid', nullable: true }) // FK → platform_ops.service_components
  serviceComponentId?: string;

  /**
   * Identificador asociado a produced by tool.
   */
  @Property({ fieldName: 'produced_by_tool_id', type: 'uuid', nullable: true }) // FK → platform_ops.tool_registry
  producedByToolId?: string;

  /**
   * Valor de artifact ref mantenido por la instancia.
   */
  @Property({ fieldName: 'artifact_ref', columnType: 'varchar' })
  artifactRef!: string;

  /**
   * Identificador asociado a artifact type concept.
   */
  @Property({ fieldName: 'artifact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  artifactTypeConceptId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  version?: string;

  /**
   * Valor de semver mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  semver?: string;

  /**
   * Valor de git ref mantenido por la instancia.
   */
  @Property({ fieldName: 'git_ref', columnType: 'varchar', nullable: true })
  gitRef?: string;

  /**
   * Valor de commit sha mantenido por la instancia.
   */
  @Property({ fieldName: 'commit_sha', columnType: 'varchar', nullable: true })
  commitSha?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @Property({ fieldName: 'storage_uri', columnType: 'text', nullable: true })
  storageUri?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', columnType: 'int', nullable: true })
  sizeBytes?: number;

  /**
   * Valor de is immutable mantenido por la instancia.
   */
  @Property({ fieldName: 'is_immutable', type: 'boolean', nullable: true })
  isImmutable?: boolean;

  /**
   * Valor de built at mantenido por la instancia.
   */
  @Property({
    fieldName: 'built_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  builtAt?: Date;

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
