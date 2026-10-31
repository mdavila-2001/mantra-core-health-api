import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Permiso de una persona de apoyo con TIPO DE OBJETIVO. Varias filas se suman; una fila con dos objetivos se cruza.
 */
@Entity({ schema: 'delegated_access', tableName: 'support_scope_grants' })
export class SupportScopeGrants {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Organización dueña de la fila (la del padre, verificada por el modelo). */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `organization_user_assignment_id`. */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments
  organizationUserAssignmentId!: string;

  /** Columna `target_kind_concept_id`. */
  @Property({ fieldName: 'target_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetKindConceptId!: string;

  /** Columna `practitioner_role_assignment_id`. */
  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId?: string;

  /** Columna `healthcare_service_id`. */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services
  healthcareServiceId?: string;

  /** Columna `care_space_id`. */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  /** Columna `practice_site_id`. */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /** Columna `expansion_mode_concept_id`. */
  @Property({ fieldName: 'expansion_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  expansionModeConceptId!: string;

  /** Columna `fixed_snapshot_json`. */
  @Property({
    fieldName: 'fixed_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fixedSnapshotJson?: unknown;

  /** Columna `valid_from`. */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /** Columna `valid_to`. */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `approved_by_user_id`. */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /** Efecto de la concesión: `authz:EFFECT_ALLOW` (por omisión) o `authz:EFFECT_DENY`. */
  @Property({
    fieldName: 'effect_concept_id',
    type: 'uuid',
    default: '6905e0db-1650-5d49-adca-8b2688ac049c',
  }) // FK → terminology.catalog_concepts
  effectConceptId: string = '6905e0db-1650-5d49-adca-8b2688ac049c';

  /** Condición ABAC de la concesión (esquema versionado, máximo 8 KiB); nula = sin condición. */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /** Versión del esquema de `condition_json`; coincide con su `schemaVersion`. */
  @Property({
    fieldName: 'condition_schema_version',
    columnType: 'int',
    nullable: true,
  })
  conditionSchemaVersion?: number;

  /** Por qué se otorgó (obligatorio por API desde la v2; nulo en lo antiguo). */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /** Plantilla (y versión) de origen de la concesión. */
  @Property({
    fieldName: 'source_role_template_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.role_templates
  sourceRoleTemplateId?: string;
}
