import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `files`.
 */
@Entity({ schema: 'common', tableName: 'files' })
export class Files {
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
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  categoryConceptId!: string;

  /**
   * Valor de original name mantenido por la instancia.
   */
  @Property({
    fieldName: 'original_name',
    columnType: 'varchar',
    nullable: true,
  })
  originalName?: string;

  /**
   * Identificador asociado a sensitivity concept.
   */
  @Property({ fieldName: 'sensitivity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sensitivityConceptId!: string;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @Property({ fieldName: 'lifecycle_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  lifecycleStatusConceptId!: string;

  /**
   * Identificador asociado a current version.
   */
  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → common.file_versions
  currentVersionId?: string;

  /**
   * Identificador asociado a retention class concept.
   */
  @Property({
    fieldName: 'retention_class_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  retentionClassConceptId?: string;

  /**
   * Valor de legal hold until mantenido por la instancia.
   */
  @Property({
    fieldName: 'legal_hold_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  legalHoldUntil?: Date;

  /**
   * Fecha y hora de la eliminación lógica, si corresponde.
   */
  @Property({
    fieldName: 'deleted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

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
