import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `resource_scope_grants`.
 */
@Entity({ schema: 'authz', tableName: 'resource_scope_grants' })
export class ResourceScopeGrants {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject.
   */
  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  /**
   * Identificador asociado a permission.
   */
  @Property({ fieldName: 'permission_id', type: 'uuid' }) // FK → authz.permissions
  permissionId!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  /**
   * Identificador asociado a resource.
   */
  @Property({ fieldName: 'resource_id', type: 'uuid' })
  resourceId!: string;

  /**
   * Identificador asociado a effect concept.
   */
  @Property({ fieldName: 'effect_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  effectConceptId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /**
   * Motivo del grant en texto libre (CL-50, v4.2.30): por qué el paciente
   * compartió el recurso.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

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
