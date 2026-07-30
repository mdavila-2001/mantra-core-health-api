import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `break_glass_sessions`.
 */
@Entity({ schema: 'authz', tableName: 'break_glass_sessions' })
export class BreakGlassSessions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a patient ref.
   */
  @Property({ fieldName: 'patient_ref_id', type: 'uuid' })
  patientRefId!: string;

  /**
   * Identificador asociado a patient ref type concept.
   */
  @Property({ fieldName: 'patient_ref_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  patientRefTypeConceptId!: string;

  /**
   * Valor de justification mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  justification!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  /**
   * Identificador asociado a granted by policy.
   */
  @Property({ fieldName: 'granted_by_policy_id', type: 'uuid', nullable: true }) // FK → authz.access_policies
  grantedByPolicyId?: string;

  /**
   * Valor de activated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'activated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  activatedAt?: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Valor de deactivated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'deactivated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deactivatedAt?: Date;

  /**
   * Identificador asociado a reviewed by user.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  /**
   * Valor de reviewed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

  /**
   * Identificador asociado a review outcome concept.
   */
  @Property({
    fieldName: 'review_outcome_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reviewOutcomeConceptId?: string;

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
