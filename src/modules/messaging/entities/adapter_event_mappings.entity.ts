import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'adapter_event_mappings' })
export class AdapterEventMappings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK (destino no resuelto)
  providerId!: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK (destino no resuelto)
  channelId!: string;

  @Property({ fieldName: 'mapping_version', columnType: 'int' })
  mappingVersion!: number;

  @Property({ fieldName: 'external_event_code', columnType: 'varchar' })
  externalEventCode!: string;

  @Property({ fieldName: 'canonical_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalEventTypeConceptId!: string;

  @Property({ fieldName: 'canonical_delivery_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalDeliveryStatusConceptId!: string;

  @Property({ type: 'boolean' })
  terminal!: boolean;

  @Property({ type: 'boolean', nullable: true })
  success?: boolean;

  @Property({ columnType: 'int' })
  precedence!: number;

  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

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
