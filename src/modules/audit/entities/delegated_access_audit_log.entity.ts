import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delegated_access_audit_log`.
 */
@Entity({ schema: 'audit', tableName: 'delegated_access_audit_log' })
export class DelegatedAccessAuditLog {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a delegate user.
   */
  @Property({ fieldName: 'delegate_user_id', type: 'uuid' }) // FK → iam.users
  delegateUserId!: string;

  /**
   * Identificador asociado a delegating practitioner profile.
   */
  @Property({ fieldName: 'delegating_practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  delegatingPractitionerProfileId!: string;

  /**
   * Identificador asociado a delegated assignment.
   */
  @Property({
    fieldName: 'delegated_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → delegated_access.practitioner_delegate_assignments
  delegatedAssignmentId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @Property({
    fieldName: 'resource_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  resourceTypeConceptId?: string;

  /**
   * Identificador asociado a resource.
   */
  @Property({ fieldName: 'resource_id', type: 'uuid', nullable: true })
  resourceId?: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
