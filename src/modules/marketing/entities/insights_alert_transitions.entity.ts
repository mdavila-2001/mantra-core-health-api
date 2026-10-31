import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_alert_transitions`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_alert_transitions' })
export class InsightsAlertTransitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a alert.
   */
  @Property({ fieldName: 'alert_id', type: 'uuid' }) // FK → marketing.insights_alerts
  alertId!: string;

  /**
   * Identificador asociado a from status concept.
   */
  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  fromStatusConceptId?: string;

  /**
   * Identificador asociado a to status concept.
   */
  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  toStatusConceptId!: string;

  /**
   * Valor de from owner team code mantenido por la instancia.
   */
  @Property({
    fieldName: 'from_owner_team_code',
    columnType: 'varchar',
    nullable: true,
  })
  fromOwnerTeamCode?: string;

  /**
   * Valor de to owner team code mantenido por la instancia.
   */
  @Property({
    fieldName: 'to_owner_team_code',
    columnType: 'varchar',
    nullable: true,
  })
  toOwnerTeamCode?: string;

  /**
   * Valor de note mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  note?: string;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  recordedByUserId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
