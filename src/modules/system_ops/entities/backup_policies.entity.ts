import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `backup_policies`.
 */
@Entity({ schema: 'system_ops', tableName: 'backup_policies' })
export class BackupPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a resource scope concept.
   */
  @Property({ fieldName: 'resource_scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceScopeConceptId!: string;

  /**
   * Identificador asociado a backup type concept.
   */
  @Property({ fieldName: 'backup_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  backupTypeConceptId!: string;

  /**
   * Valor de rpo seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'rpo_seconds', columnType: 'int', nullable: true })
  rpoSeconds?: number;

  /**
   * Valor de rto seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'rto_seconds', columnType: 'int', nullable: true })
  rtoSeconds?: number;

  /**
   * Valor de retention days mantenido por la instancia.
   */
  @Property({ fieldName: 'retention_days', columnType: 'int', nullable: true })
  retentionDays?: number;

  /**
   * Valor de immutable copy required mantenido por la instancia.
   */
  @Property({
    fieldName: 'immutable_copy_required',
    type: 'boolean',
    nullable: true,
  })
  immutableCopyRequired?: boolean;

  /**
   * Valor de encryption required mantenido por la instancia.
   */
  @Property({
    fieldName: 'encryption_required',
    type: 'boolean',
    nullable: true,
  })
  encryptionRequired?: boolean;

  /**
   * Valor de restore test frequency days mantenido por la instancia.
   */
  @Property({
    fieldName: 'restore_test_frequency_days',
    columnType: 'int',
    nullable: true,
  })
  restoreTestFrequencyDays?: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
