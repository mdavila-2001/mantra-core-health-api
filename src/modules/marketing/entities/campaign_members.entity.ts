import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'campaign_members' })
export class CampaignMembers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns
  campaignId!: string;

  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  @Property({ fieldName: 'member_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberStatusConceptId!: string;

  @Property({
    fieldName: 'added_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  addedAt?: Date;

  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  @Property({
    fieldName: 'source_segment_member_id',
    type: 'uuid',
    nullable: true,
  }) // FK → marketing.segment_members
  sourceSegmentMemberId?: string;

  @Property({ fieldName: 'first_dispatch_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  firstDispatchId?: string;

  @Property({ fieldName: 'last_dispatch_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  lastDispatchId?: string;

  @Property({
    fieldName: 'total_dispatches',
    columnType: 'int',
    nullable: true,
  })
  totalDispatches?: number;
}
