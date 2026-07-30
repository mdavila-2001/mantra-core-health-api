import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delegated_permission_set_items`.
 */
@Entity({
  schema: 'delegated_access',
  tableName: 'delegated_permission_set_items',
})
export class DelegatedPermissionSetItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a delegated permission set.
   */
  @Property({ fieldName: 'delegated_permission_set_id', type: 'uuid' }) // FK → delegated_access.delegated_permission_sets
  delegatedPermissionSetId!: string;

  /**
   * Identificador asociado a permission.
   */
  @Property({ fieldName: 'permission_id', type: 'uuid' }) // FK → authz.permissions
  permissionId!: string;

  /**
   * Valor de constraint json mantenido por la instancia.
   */
  @Property({
    fieldName: 'constraint_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  constraintJson?: unknown;

  /**
   * Valor de requires step up authentication mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_step_up_authentication',
    type: 'boolean',
    nullable: true,
  })
  requiresStepUpAuthentication?: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
