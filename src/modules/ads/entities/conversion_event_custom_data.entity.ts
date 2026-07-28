import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversion_event_custom_data`.
 */
@Entity({ schema: 'ads', tableName: 'conversion_event_custom_data' })
export class ConversionEventCustomData {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a server conversion event.
   */
  @Property({ fieldName: 'server_conversion_event_id', type: 'uuid' }) // FK → ads.server_conversion_events
  serverConversionEventId!: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  /**
   * Valor de value amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  valueAmount?: string;

  /**
   * Valor de content ids json mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contentIdsJson?: unknown;

  /**
   * Valor de content type mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_type',
    columnType: 'varchar',
    nullable: true,
  })
  contentType?: string;

  /**
   * Valor de contents json mantenido por la instancia.
   */
  @Property({
    fieldName: 'contents_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  contentsJson?: unknown;

  /**
   * Valor de num items mantenido por la instancia.
   */
  @Property({ fieldName: 'num_items', columnType: 'int', nullable: true })
  numItems?: number;

  /**
   * Identificador asociado a order.
   */
  @Property({ fieldName: 'order_id', columnType: 'varchar', nullable: true })
  orderId?: string;

  /**
   * Valor de custom properties json mantenido por la instancia.
   */
  @Property({
    fieldName: 'custom_properties_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customPropertiesJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
