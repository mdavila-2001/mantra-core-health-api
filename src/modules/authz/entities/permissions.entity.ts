import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `permissions`.
 */
@Entity({ schema: 'authz', tableName: 'permissions' })
export class Permissions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Identificador asociado a category.
   */
  @Property({ fieldName: 'category_id', type: 'uuid', nullable: true }) // FK → authz.permission_categories
  categoryId?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de resource mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  resource!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a default scope concept.
   */
  @Property({
    fieldName: 'default_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultScopeConceptId?: string;

  /**
   * Valor de is field level mantenido por la instancia.
   */
  @Property({ fieldName: 'is_field_level', type: 'boolean', nullable: true })
  isFieldLevel?: boolean;

  /**
   * Valor de is dangerous mantenido por la instancia.
   */
  @Property({ fieldName: 'is_dangerous', type: 'boolean', nullable: true })
  isDangerous?: boolean;

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

  /**
   * Valor de is role restricted mantenido por la instancia.
   */
  @Property({ fieldName: 'is_role_restricted', type: 'boolean' })
  isRoleRestricted!: boolean;

  /**
   * Valor de required role code mantenido por la instancia.
   */
  @Property({
    fieldName: 'required_role_code',
    columnType: 'varchar',
    nullable: true,
  })
  requiredRoleCode?: string;

  /**
   * Valor de allow direct user grant mantenido por la instancia.
   */
  @Property({ fieldName: 'allow_direct_user_grant', type: 'boolean' })
  allowDirectUserGrant!: boolean;
}
