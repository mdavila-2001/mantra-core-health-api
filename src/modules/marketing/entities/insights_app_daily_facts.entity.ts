import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_app_daily_facts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_app_daily_facts' })
export class InsightsAppDailyFacts {
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
   * Valor de dau mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  dau?: string;

  /**
   * Valor de wau mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  wau?: string;

  /**
   * Valor de mau mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  mau?: string;

  /**
   * Valor de sessions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  sessions?: string;

  /**
   * Valor de total session seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_session_seconds',
    type: 'bigint',
    nullable: true,
  })
  totalSessionSeconds?: string;

  /**
   * Valor de new users mantenido por la instancia.
   */
  @Property({ fieldName: 'new_users', type: 'bigint', nullable: true })
  newUsers?: string;

  /**
   * Valor de returning users mantenido por la instancia.
   */
  @Property({ fieldName: 'returning_users', type: 'bigint', nullable: true })
  returningUsers?: string;

  /**
   * Valor de searches mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  searches?: string;

  /**
   * Valor de bookings started mantenido por la instancia.
   */
  @Property({ fieldName: 'bookings_started', type: 'bigint', nullable: true })
  bookingsStarted?: string;

  /**
   * Valor de bookings completed mantenido por la instancia.
   */
  @Property({ fieldName: 'bookings_completed', type: 'bigint', nullable: true })
  bookingsCompleted?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
