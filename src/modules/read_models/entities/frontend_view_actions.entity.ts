import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frontend_view_actions`.
 */
@Entity({ schema: 'read_models', tableName: 'frontend_view_actions' })
export class FrontendViewActions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a frontend page view.
   */
  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  /**
   * Valor de action code mantenido por la instancia.
   */
  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Identificador asociado a action type concept.
   */
  @Property({ fieldName: 'action_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionTypeConceptId!: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  /**
   * Identificador asociado a required permission.
   */
  @Property({
    fieldName: 'required_permission_id',
    type: 'uuid',
    nullable: true,
  }) // FK → authz.permissions
  requiredPermissionId?: string;

  /**
   * Identificador asociado a allowed state value set.
   */
  @Property({
    fieldName: 'allowed_state_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedStateValueSetId?: string;

  /**
   * Identificador asociado a confirmation policy concept.
   */
  @Property({
    fieldName: 'confirmation_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  confirmationPolicyConceptId?: string;

  /**
   * Valor de idempotency required mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_required',
    type: 'boolean',
    nullable: true,
  })
  idempotencyRequired?: boolean;

  /**
   * Valor de icon key mantenido por la instancia.
   */
  @Property({ fieldName: 'icon_key', columnType: 'varchar', nullable: true })
  iconKey?: string;

  /**
   * Identificador asociado a prominence concept.
   */
  @Property({
    fieldName: 'prominence_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  prominenceConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

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
