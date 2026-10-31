import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_app_screen_daily_facts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_app_screen_daily_facts' })
export class InsightsAppScreenDailyFacts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de fact date mantenido por la instancia.
   */
  @Property({ fieldName: 'fact_date', columnType: 'date' })
  factDate!: Date;

  /**
   * Valor de platform code mantenido por la instancia.
   */
  @Property({ fieldName: 'platform_code', columnType: 'varchar' })
  platformCode!: string;

  /**
   * Valor de screen code mantenido por la instancia.
   */
  @Property({ fieldName: 'screen_code', columnType: 'varchar' })
  screenCode!: string;

  /**
   * Valor de views mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  views?: string;

  /**
   * Valor de exits mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  exits?: string;

  /**
   * Valor de rage taps mantenido por la instancia.
   */
  @Property({ fieldName: 'rage_taps', type: 'bigint', nullable: true })
  rageTaps?: string;

  /**
   * Valor de avg seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'avg_seconds', columnType: 'int', nullable: true })
  avgSeconds?: number;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
