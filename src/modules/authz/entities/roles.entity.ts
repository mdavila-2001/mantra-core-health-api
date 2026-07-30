import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `roles`.
 */
@Entity({ schema: 'authz', tableName: 'roles' })
export class Roles {
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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a parent role.
   */
  @Property({ fieldName: 'parent_role_id', type: 'uuid', nullable: true }) // FK → authz.roles
  parentRoleId?: string;

  /**
   * Identificador asociado a base role concept.
   */
  @Property({ fieldName: 'base_role_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  baseRoleConceptId?: string;

  /**
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  scopeConceptId?: string;

  /**
   * Valor de is system mantenido por la instancia.
   */
  @Property({ fieldName: 'is_system', type: 'boolean' })
  isSystem!: boolean;

  /**
   * Valor de is assignable mantenido por la instancia.
   */
  @Property({ fieldName: 'is_assignable', type: 'boolean' })
  isAssignable!: boolean;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  priority?: number;

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
