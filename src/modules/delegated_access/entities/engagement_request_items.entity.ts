import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `engagement_request_items`.
 */
@Entity({ schema: 'delegated_access', tableName: 'engagement_request_items' })
export class EngagementRequestItems {
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
   * Identificador asociado a engagement request.
   */
  @Property({ fieldName: 'engagement_request_id', type: 'uuid' }) // FK → delegated_access.engagement_requests (inferida)
  engagementRequestId!: string;

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
   * Valor de proposed actions json mantenido por la instancia.
   */
  @Property({
    fieldName: 'proposed_actions_json',
    type: 'json',
    columnType: 'jsonb',
  })
  proposedActionsJson!: unknown;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  decisionConceptId!: string;

  /**
   * Valor de decision comment text mantenido por la instancia.
   */
  @Property({
    fieldName: 'decision_comment_text',
    columnType: 'text',
    nullable: true,
  })
  decisionCommentText?: string;

  /**
   * Identificador asociado a resulting grant.
   */
  @Property({ fieldName: 'resulting_grant_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  resultingGrantId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
