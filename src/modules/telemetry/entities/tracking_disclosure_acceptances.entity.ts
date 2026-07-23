import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'tracking_disclosure_acceptances' })
export class TrackingDisclosureAcceptances {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tracking_disclosure_version_id', type: 'uuid' }) // FK → telemetry.tracking_disclosure_versions
  trackingDisclosureVersionId!: string;

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true }) // FK → iam.sessions
  sessionId?: string;

  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

  @Property({
    fieldName: 'ip_prefix_hash',
    columnType: 'varchar',
    nullable: true,
  })
  ipPrefixHash?: string;

  @Property({
    fieldName: 'user_agent_hash',
    columnType: 'varchar',
    nullable: true,
  })
  userAgentHash?: string;

  @Property({ fieldName: 'acceptance_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  acceptanceStatusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
