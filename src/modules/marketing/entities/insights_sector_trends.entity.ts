import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_sector_trends`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_sector_trends' })
export class InsightsSectorTrends {
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
   * Valor de trend code mantenido por la instancia.
   */
  @Property({ fieldName: 'trend_code', columnType: 'varchar' })
  trendCode!: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(18,4)' })
  value!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
