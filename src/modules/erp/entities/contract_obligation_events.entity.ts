import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_obligation_events' })
export class ContractObligationEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_obligation_id', type: 'uuid' }) // FK → erp.contract_obligations
  contractObligationId!: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({
    fieldName: 'event_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  eventAt?: Date;

  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
