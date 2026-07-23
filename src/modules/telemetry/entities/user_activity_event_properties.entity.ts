import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'user_activity_event_properties' })
export class UserActivityEventProperties {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_activity_event_id', type: 'uuid' }) // FK → telemetry.user_activity_events
  userActivityEventId!: string;

  @Property({ fieldName: 'property_name', columnType: 'varchar' })
  propertyName!: string;

  @Property({ fieldName: 'value_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  valueTypeConceptId!: string;

  @Property({ fieldName: 'value_string', columnType: 'text', nullable: true })
  valueString?: string;

  @Property({
    fieldName: 'value_number',
    columnType: 'numeric',
    nullable: true,
  })
  valueNumber?: string;

  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  @Property({
    fieldName: 'value_timestamp',
    columnType: 'timestamptz',
    nullable: true,
  })
  valueTimestamp?: Date;

  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  @Property({ fieldName: 'value_hash', columnType: 'varchar', nullable: true })
  valueHash?: string;

  @Property({ fieldName: 'data_classification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dataClassificationConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
