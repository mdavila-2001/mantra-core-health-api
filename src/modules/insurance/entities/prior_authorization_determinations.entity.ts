import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'insurance',
  tableName: 'prior_authorization_determinations',
})
export class PriorAuthorizationDeterminations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'prior_authorization_request_id', type: 'uuid' }) // FK → insurance.prior_authorization_requests
  priorAuthorizationRequestId!: string;

  @Property({
    fieldName: 'prior_authorization_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.prior_authorization_items
  priorAuthorizationItemId?: string;

  @Property({ fieldName: 'determination_version', columnType: 'int' })
  determinationVersion!: number;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({
    fieldName: 'approved_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  approvedQuantity?: string;

  @Property({
    fieldName: 'approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  approvedAmount?: string;

  @Property({
    fieldName: 'denial_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  denialReasonConceptId?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'supporting_file_id', type: 'uuid', nullable: true }) // FK → common.files
  supportingFileId?: string;

  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;

  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;
}
