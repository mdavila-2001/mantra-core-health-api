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

  /** Organización del vínculo (v4.2.73): la de su membresía, verificada por el modelo (trigger + RLS). */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
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

  /** Columna `origin_concept_id`. */
  @Property({ fieldName: 'origin_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  originConceptId?: string;

  /** Columna `owner_kind_concept_id`. */
  @Property({
    fieldName: 'owner_kind_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ownerKindConceptId?: string;

  /** Columna `role_template_id`. */
  @Property({ fieldName: 'role_template_id', type: 'uuid', nullable: true }) // FK → delegated_access.role_templates
  roleTemplateId?: string;

  /** Columna `recertify_every_months`. */
  @Property({
    fieldName: 'recertify_every_months',
    columnType: 'int',
    nullable: true,
  })
  recertifyEveryMonths?: number;

  /** Columna `next_recertification_at`. */
  @Property({
    fieldName: 'next_recertification_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRecertificationAt?: Date;

  /** Columna `ended_reason_text`. */
  @Property({
    fieldName: 'ended_reason_text',
    columnType: 'text',
    nullable: true,
  })
  endedReasonText?: string;

  /** Cuándo se verificó la identidad de la persona. */
  @Property({
    fieldName: 'identity_verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  identityVerifiedAt?: Date;

  /** Quién verificó la identidad. */
  @Property({
    fieldName: 'identity_verified_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  identityVerifiedByUserId?: string;

  /** Cómo se verificó la identidad (`delegated_access:IDENTITY_METHOD_*`). */
  @Property({
    fieldName: 'identity_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  identityMethodConceptId?: string;

  /** Cuándo se suspendió el vínculo; nulo si no está suspendido. */
  @Property({
    fieldName: 'suspended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  suspendedAt?: Date;

  /** Motivo de la suspensión (`delegated_access:SUSPENSION_*`). */
  @Property({
    fieldName: 'suspension_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  suspensionReasonConceptId?: string;

  /** Nota de la suspensión. */
  @Property({
    fieldName: 'suspension_note_text',
    columnType: 'text',
    nullable: true,
  })
  suspensionNoteText?: string;

  /** Cuándo la persona terminó su inducción (ingreso). */
  @Property({
    fieldName: 'onboarding_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  onboardingCompletedAt?: Date;

  /** Última certificación de sus accesos. */
  @Property({
    fieldName: 'last_certified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastCertifiedAt?: Date;

  /** Última actividad (caché del barrido, solo para el tablero). */
  @Property({
    fieldName: 'last_active_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastActiveAt?: Date;
}
