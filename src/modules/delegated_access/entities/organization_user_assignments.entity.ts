import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `organization_user_assignments`.
 */
@Entity({
  schema: 'delegated_access',
  tableName: 'organization_user_assignments',
})
export class OrganizationUserAssignments {
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
   * Identificador asociado a tenant membership.
   */
  @Property({ fieldName: 'tenant_membership_id', type: 'uuid' }) // FK → directory.tenant_memberships
  tenantMembershipId!: string;

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units
  clinicalUnitId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  /**
   * Identificador asociado a diagnostic unit.
   */
  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid', nullable: true }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId?: string;

  /**
   * Identificador asociado a pharmacy.
   */
  @Property({ fieldName: 'pharmacy_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacies
  pharmacyId?: string;

  /**
   * Identificador asociado a assignment role concept.
   */
  @Property({ fieldName: 'assignment_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assignmentRoleConceptId!: string;

  /**
   * Identificador asociado a access scope concept.
   */
  @Property({ fieldName: 'access_scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accessScopeConceptId!: string;

  /**
   * Identificador asociado a supervisor user.
   */
  @Property({ fieldName: 'supervisor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  supervisorUserId?: string;

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

  /**
   * Identificador asociado a origin concept.
   */
  @Property({ fieldName: 'origin_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  originConceptId?: string;

  /**
   * Identificador asociado a owner kind concept.
   */
  @Property({
    fieldName: 'owner_kind_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  ownerKindConceptId?: string;

  /**
   * Identificador asociado a role template.
   */
  @Property({ fieldName: 'role_template_id', type: 'uuid', nullable: true }) // FK → delegated_access.role_templates (inferida)
  roleTemplateId?: string;

  /**
   * Valor de recertify every months mantenido por la instancia.
   */
  @Property({
    fieldName: 'recertify_every_months',
    columnType: 'int',
    nullable: true,
  })
  recertifyEveryMonths?: number;

  /**
   * Valor de next recertification at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_recertification_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRecertificationAt?: Date;

  /**
   * Valor de ended reason text mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_reason_text',
    columnType: 'text',
    nullable: true,
  })
  endedReasonText?: string;

  /**
   * Identificador asociado a initiated by party concept.
   */
  @Property({
    fieldName: 'initiated_by_party_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  initiatedByPartyConceptId?: string;

  /**
   * Valor de identity verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'identity_verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  identityVerifiedAt?: Date;

  /**
   * Identificador asociado a identity verified by user.
   */
  @Property({
    fieldName: 'identity_verified_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users (inferida)
  identityVerifiedByUserId?: string;

  /**
   * Identificador asociado a identity method concept.
   */
  @Property({
    fieldName: 'identity_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  identityMethodConceptId?: string;

  /**
   * Valor de suspended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'suspended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  suspendedAt?: Date;

  /**
   * Identificador asociado a suspension reason concept.
   */
  @Property({
    fieldName: 'suspension_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  suspensionReasonConceptId?: string;

  /**
   * Valor de suspension note text mantenido por la instancia.
   */
  @Property({
    fieldName: 'suspension_note_text',
    columnType: 'text',
    nullable: true,
  })
  suspensionNoteText?: string;

  /**
   * Valor de onboarding completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'onboarding_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  onboardingCompletedAt?: Date;

  /**
   * Valor de last certified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_certified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastCertifiedAt?: Date;

  /**
   * Valor de last active at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_active_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastActiveAt?: Date;
}
