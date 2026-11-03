import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `audio_generation_events`.
 */
@Entity({ schema: 'audio_assets', tableName: 'audio_generation_events' })
export class AudioGenerationEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de asset key mantenido por la instancia.
   */
  @Property({ fieldName: 'asset_key', columnType: 'char(64)', nullable: true })
  assetKey?: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @Property({ fieldName: 'event_type', columnType: 'varchar' })
  eventType!: string;

  /**
   * Valor de provider mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  provider?: string;

  /**
   * Valor de template key mantenido por la instancia.
   */
  @Property({
    fieldName: 'template_key',
    columnType: 'varchar',
    nullable: true,
  })
  templateKey?: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  outcome!: string;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

  /**
   * Valor de estimated cost units mantenido por la instancia.
   */
  @Property({
    fieldName: 'estimated_cost_units',
    columnType: 'int',
    nullable: true,
  })
  estimatedCostUnits?: number;

  /**
   * Identificador asociado a correlation.
   */
  @Property({
    fieldName: 'correlation_id',
    columnType: 'varchar',
    nullable: true,
  })
  correlationId?: string;

  /**
   * Identificador asociado a trace.
   */
  @Property({ fieldName: 'trace_id', columnType: 'varchar', nullable: true })
  traceId?: string;

  /**
   * Valor de metadata mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  metadata!: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
