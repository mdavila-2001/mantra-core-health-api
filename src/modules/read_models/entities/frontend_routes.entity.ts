import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frontend_routes`.
 */
@Entity({ schema: 'read_models', tableName: 'frontend_routes' })
export class FrontendRoutes {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a portal surface.
   */
  @Property({ fieldName: 'portal_surface_id', type: 'uuid' }) // FK → read_models.portal_surfaces
  portalSurfaceId!: string;

  /**
   * Valor de route code mantenido por la instancia.
   */
  @Property({ fieldName: 'route_code', columnType: 'varchar' })
  routeCode!: string;

  /**
   * Valor de route pattern mantenido por la instancia.
   */
  @Property({ fieldName: 'route_pattern', columnType: 'varchar' })
  routePattern!: string;

  /**
   * Valor de page title mantenido por la instancia.
   */
  @Property({ fieldName: 'page_title', columnType: 'varchar' })
  pageTitle!: string;

  /**
   * Valor de navigation group mantenido por la instancia.
   */
  @Property({
    fieldName: 'navigation_group',
    columnType: 'varchar',
    nullable: true,
  })
  navigationGroup?: string;

  /**
   * Valor de navigation icon key mantenido por la instancia.
   */
  @Property({
    fieldName: 'navigation_icon_key',
    columnType: 'varchar',
    nullable: true,
  })
  navigationIconKey?: string;

  /**
   * Valor de breadcrumb json mantenido por la instancia.
   */
  @Property({
    fieldName: 'breadcrumb_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  breadcrumbJson?: unknown;

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
   * Identificador asociado a purpose of use concept.
   */
  @Property({
    fieldName: 'purpose_of_use_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId?: string;

  /**
   * Valor de feature flag code mantenido por la instancia.
   */
  @Property({
    fieldName: 'feature_flag_code',
    columnType: 'varchar',
    nullable: true,
  })
  featureFlagCode?: string;

  /**
   * Valor de requires patient context mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_patient_context',
    type: 'boolean',
    nullable: true,
  })
  requiresPatientContext?: boolean;

  /**
   * Valor de requires tenant context mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_tenant_context',
    type: 'boolean',
    nullable: true,
  })
  requiresTenantContext?: boolean;

  /**
   * Identificador asociado a cache policy concept.
   */
  @Property({
    fieldName: 'cache_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cachePolicyConceptId?: string;

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
