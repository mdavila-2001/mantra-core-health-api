import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `coverage_eligibility_responses`.
 */
@Entity({ schema: 'insurance', tableName: 'coverage_eligibility_responses' })
export class CoverageEligibilityResponses {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a coverage eligibility request.
   */
  @Property({ fieldName: 'coverage_eligibility_request_id', type: 'uuid' }) // FK → insurance.coverage_eligibility_requests
  coverageEligibilityRequestId!: string;

  /**
   * Valor de response version mantenido por la instancia.
   */
  @Property({ fieldName: 'response_version', columnType: 'int' })
  responseVersion!: number;

  /**
   * Valor de in force mantenido por la instancia.
   */
  @Property({ fieldName: 'in_force', type: 'boolean' })
  inForce!: boolean;

  /**
   * Valor de benefit summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'benefit_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  benefitSummaryJson?: unknown;

  /**
   * Valor de authorization requirements json mantenido por la instancia.
   */
  @Property({
    fieldName: 'authorization_requirements_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  authorizationRequirementsJson?: unknown;

  /**
   * Valor de response reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_reference',
    columnType: 'varchar',
    nullable: true,
  })
  responseReference?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({ fieldName: 'responded_at', columnType: 'timestamptz' })
  respondedAt!: Date;

  /**
   * Identificador asociado a responded by user.
   */
  @Property({ fieldName: 'responded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  respondedByUserId?: string;
}
