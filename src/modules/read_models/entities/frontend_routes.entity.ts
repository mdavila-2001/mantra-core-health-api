import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_routes' })
export class FrontendRoutes {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'portal_surface_id', type: 'uuid' }) // FK → read_models.portal_surfaces
  portalSurfaceId!: string;

  @Property({ fieldName: 'route_code', columnType: 'varchar' })
  routeCode!: string;

  @Property({ fieldName: 'route_pattern', columnType: 'varchar' })
  routePattern!: string;

  @Property({ fieldName: 'page_title', columnType: 'varchar' })
  pageTitle!: string;

  @Property({
    fieldName: 'navigation_group',
    columnType: 'varchar',
    nullable: true,
  })
  navigationGroup?: string;

  @Property({
    fieldName: 'navigation_icon_key',
    columnType: 'varchar',
    nullable: true,
  })
  navigationIconKey?: string;

  @Property({
    fieldName: 'breadcrumb_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  breadcrumbJson?: unknown;

  @Property({
    fieldName: 'required_permission_id',
    type: 'uuid',
    nullable: true,
  }) // FK → authz.permissions
  requiredPermissionId?: string;

  @Property({
    fieldName: 'purpose_of_use_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId?: string;

  @Property({
    fieldName: 'feature_flag_code',
    columnType: 'varchar',
    nullable: true,
  })
  featureFlagCode?: string;

  @Property({
    fieldName: 'requires_patient_context',
    type: 'boolean',
    nullable: true,
  })
  requiresPatientContext?: boolean;

  @Property({
    fieldName: 'requires_tenant_context',
    type: 'boolean',
    nullable: true,
  })
  requiresTenantContext?: boolean;

  @Property({
    fieldName: 'cache_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cachePolicyConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
