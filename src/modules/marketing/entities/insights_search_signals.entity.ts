import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_search_signals`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_search_signals' })
export class InsightsSearchSignals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de week start mantenido por la instancia.
   */
  @Property({ fieldName: 'week_start', columnType: 'date' })
  weekStart!: Date;

  /**
   * Valor de query text mantenido por la instancia.
   */
  @Property({ fieldName: 'query_text', columnType: 'varchar' })
  queryText!: string;

  /**
   * Valor de kind code mantenido por la instancia.
   */
  @Property({ fieldName: 'kind_code', columnType: 'varchar' })
  kindCode!: string;

  /**
   * Valor de volume mantenido por la instancia.
   */
  @Property({ type: 'bigint' })
  volume!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
