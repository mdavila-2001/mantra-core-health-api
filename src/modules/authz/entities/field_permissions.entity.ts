import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_permissions`.
 */
@Entity({ schema: 'authz', tableName: 'field_permissions' })
export class FieldPermissions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a role.
   */
  @Property({ fieldName: 'role_id', type: 'uuid' }) // FK → authz.roles
  roleId!: string;

  /**
   * Valor de entity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  entity!: string;

  /**
   * Valor de column name mantenido por la instancia.
   */
  @Property({ fieldName: 'column_name', columnType: 'varchar' })
  columnName!: string;

  /**
   * Valor de can read mantenido por la instancia.
   */
  @Property({ fieldName: 'can_read', type: 'boolean' })
  canRead!: boolean;

  /**
   * Valor de can write mantenido por la instancia.
   */
  @Property({ fieldName: 'can_write', type: 'boolean' })
  canWrite!: boolean;

  /**
   * Identificador asociado a mask strategy concept.
   */
  @Property({
    fieldName: 'mask_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maskStrategyConceptId?: string;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

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
