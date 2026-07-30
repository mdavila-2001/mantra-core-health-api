import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_verification_access_log`.
 */
@Entity({ schema: 'audit', tableName: 'identity_verification_access_log' })
export class IdentityVerificationAccessLog {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a verification case.
   */
  @Property({ fieldName: 'verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  verificationCaseId!: string;

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a evidence type concept.
   */
  @Property({
    fieldName: 'evidence_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  evidenceTypeConceptId?: string;

  /**
   * Identificador asociado a data disclosed value set.
   */
  @Property({
    fieldName: 'data_disclosed_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  dataDisclosedValueSetId?: string;

  /**
   * Identificador asociado a purpose of use concept.
   */
  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

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
