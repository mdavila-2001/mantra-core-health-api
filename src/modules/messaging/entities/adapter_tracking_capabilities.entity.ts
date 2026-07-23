import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'adapter_tracking_capabilities' })
export class AdapterTrackingCapabilities {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK (destino no resuelto)
  providerId!: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK (destino no resuelto)
  channelId!: string;

  @Property({ fieldName: 'canonical_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalEventTypeConceptId!: string;

  @Property({ fieldName: 'support_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  supportLevelConceptId!: string;

  @Property({ fieldName: 'evidence_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceSourceConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
