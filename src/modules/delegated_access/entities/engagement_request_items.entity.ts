import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Ítem de una solicitud: un objetivo y las acciones propuestas, con decisión propia (aprobación parcial).
 */
@Entity({ schema: 'delegated_access', tableName: 'engagement_request_items' })
export class EngagementRequestItems {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Organización dueña de la fila (la del padre, verificada por el modelo). */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `engagement_request_id`. */
  @Property({ fieldName: 'engagement_request_id', type: 'uuid' }) // FK → delegated_access.engagement_requests
  engagementRequestId!: string;

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

  /** Columna `proposed_actions_json`. */
  @Property({
    fieldName: 'proposed_actions_json',
    type: 'json',
    columnType: 'jsonb',
  })
  proposedActionsJson!: unknown;

  /** Columna `decision_concept_id`. */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /** Columna `decision_comment_text`. */
  @Property({
    fieldName: 'decision_comment_text',
    columnType: 'text',
    nullable: true,
  })
  decisionCommentText?: string;

  /** Columna `resulting_grant_id`. */
  @Property({ fieldName: 'resulting_grant_id', type: 'uuid', nullable: true }) // FK → delegated_access.support_scope_grants
  resultingGrantId?: string;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
