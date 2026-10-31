import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'observability', tableName: 'alert_evaluations' })
export class AlertEvaluations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'timestamptz' })
  time!: Date;

  @Property({ fieldName: 'alert_rule_id', type: 'uuid' }) // FK → observability.alert_rules (inferida)
  alertRuleId!: string;

  @Property({ fieldName: 'observed_value', columnType: 'double precision' })
  observedValue!: number;

  @Property({ type: 'boolean' })
  fired!: boolean;

  @Property({ fieldName: 'health_incident_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_incidents (inferida)
  healthIncidentId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
