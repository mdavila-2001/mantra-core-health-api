import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audit', tableName: 'pharmacy_inventory_access_log' })
export class PharmacyInventoryAccessLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({
    fieldName: 'target_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  targetTypeConceptId?: string;

  @Property({ fieldName: 'target_id', type: 'uuid', nullable: true })
  targetId?: string;

  @Property({
    fieldName: 'purpose_of_use_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;
}
