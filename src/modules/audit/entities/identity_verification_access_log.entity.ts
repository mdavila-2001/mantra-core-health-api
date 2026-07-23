import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audit', tableName: 'identity_verification_access_log' })
export class IdentityVerificationAccessLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'verification_case_id', type: 'uuid' }) // FK (destino no resuelto)
  verificationCaseId!: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({
    fieldName: 'evidence_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  evidenceTypeConceptId?: string;

  @Property({
    fieldName: 'data_disclosed_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  dataDisclosedValueSetId?: string;

  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
