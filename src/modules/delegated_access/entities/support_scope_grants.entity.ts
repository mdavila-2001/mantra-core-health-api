import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `support_scope_grants`.
 */
@Entity({ schema: 'delegated_access', tableName: 'support_scope_grants' })
export class SupportScopeGrants {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a organization user assignment.
   */
  @Property({ fieldName: 'organization_user_assignment_id', type: 'uuid' }) // FK → delegated_access.organization_user_assignments (inferida)
  organizationUserAssignmentId!: string;

  /**
   * Identificador asociado a target kind concept.
   */
  @Property({ fieldName: 'target_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  targetKindConceptId!: string;

  /**
   * Identificador asociado a practitioner role assignment.
   */
  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments (inferida)
  practitionerRoleAssignmentId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services (inferida)
  healthcareServiceId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces (inferida)
  careSpaceId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites (inferida)
  practiceSiteId?: string;

  /**
   * Identificador asociado a expansion mode concept.
   */
  @Property({ fieldName: 'expansion_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  expansionModeConceptId!: string;

  /**
   * Valor de fixed snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'fixed_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fixedSnapshotJson?: unknown;

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
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  approvedByUserId?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /**
   * Identificador asociado a effect concept.
   */
  @Property({
    fieldName: 'effect_concept_id',
    type: 'uuid',
    default: '6905e0db-1650-5d49-adca-8b2688ac049c',
  }) // FK → terminology.catalog_concepts (inferida)
  effectConceptId!: string;

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
   * Valor de condition schema version mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_schema_version',
    columnType: 'int',
    nullable: true,
  })
  conditionSchemaVersion?: number;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Identificador asociado a source role template.
   */
  @Property({
    fieldName: 'source_role_template_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  sourceRoleTemplateId?: string;
}
