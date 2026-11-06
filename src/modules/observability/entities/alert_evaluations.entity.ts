import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `alert_evaluations`.
 */
@Entity({ schema: 'observability', tableName: 'alert_evaluations' })
export class AlertEvaluations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de time mantenido por la instancia.
   */
  @Property({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a alert rule.
   */
  @Property({ fieldName: 'alert_rule_id', type: 'uuid' }) // FK → observability.alert_rules (inferida)
  alertRuleId!: string;

  /**
   * Valor de observed value mantenido por la instancia.
   */
  @Property({ fieldName: 'observed_value', columnType: 'double precision' })
  observedValue!: number;

  /**
   * Valor de fired mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  fired!: boolean;

  /**
   * Identificador asociado a health incident.
   */
  @Property({ fieldName: 'health_incident_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_incidents (inferida)
  healthIncidentId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
