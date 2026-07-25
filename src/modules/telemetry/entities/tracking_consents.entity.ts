import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'tracking_consents' })
export class TrackingConsents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'purpose_definition_id', type: 'uuid' }) // FK → telemetry.tracking_purpose_definitions
  purposeDefinitionId!: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  @Property({
    fieldName: 'consent_version',
    columnType: 'varchar',
    nullable: true,
  })
  consentVersion?: string;

  @Property({
    fieldName: 'granted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  grantedAt?: Date;

  @Property({
    fieldName: 'withdrawn_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  withdrawnAt?: Date;

  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
