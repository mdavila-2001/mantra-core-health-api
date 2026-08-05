import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `user_permission_grants`.
 */
@Entity({ schema: 'authz', tableName: 'user_permission_grants' })
export class UserPermissionGrants {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a permission.
   */
  @Property({ fieldName: 'permission_id', type: 'uuid' }) // FK → authz.permissions
  permissionId!: string;

  /**
   * Identificador asociado a effect concept.
   */
  @Property({ fieldName: 'effect_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  effectConceptId!: string;

  /**
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  scopeConceptId?: string;

  /**
   * Valor de resource selector json mantenido por la instancia.
   */
  @Property({
    fieldName: 'resource_selector_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  resourceSelectorJson?: unknown;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

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
