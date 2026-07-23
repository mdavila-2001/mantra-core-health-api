import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'conversion_event_custom_data' })
export class ConversionEventCustomData {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'server_conversion_event_id', type: 'uuid' }) // FK → ads.server_conversion_events
  serverConversionEventId!: string;

  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  @Property({
    fieldName: 'value_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  valueAmount?: string;

  @Property({
    fieldName: 'content_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contentIdsJson?: unknown;

  @Property({
    fieldName: 'content_type',
    columnType: 'varchar',
    nullable: true,
  })
  contentType?: string;

  @Property({
    fieldName: 'contents_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contentsJson?: unknown;

  @Property({ fieldName: 'num_items', columnType: 'int', nullable: true })
  numItems?: number;

  @Property({ fieldName: 'order_id', columnType: 'varchar', nullable: true })
  orderId?: string;

  @Property({
    fieldName: 'custom_properties_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customPropertiesJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
