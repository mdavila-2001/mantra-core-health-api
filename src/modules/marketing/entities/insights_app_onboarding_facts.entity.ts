import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_app_onboarding_facts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_app_onboarding_facts' })
export class InsightsAppOnboardingFacts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de app version mantenido por la instancia.
   */
  @Property({ fieldName: 'app_version', columnType: 'varchar' })
  appVersion!: string;

  /**
   * Valor de step code mantenido por la instancia.
   */
  @Property({ fieldName: 'step_code', columnType: 'varchar' })
  stepCode!: string;

  /**
   * Valor de step order mantenido por la instancia.
   */
  @Property({ fieldName: 'step_order', columnType: 'int' })
  stepOrder!: number;

  /**
   * Valor de users reached mantenido por la instancia.
   */
  @Property({ fieldName: 'users_reached', type: 'bigint', nullable: true })
  usersReached?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
