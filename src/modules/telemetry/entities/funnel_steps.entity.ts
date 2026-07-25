import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'funnel_steps' })
export class FunnelSteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'funnel_definition_id', type: 'uuid' }) // FK → telemetry.funnel_definitions
  funnelDefinitionId!: string;

  @Property({ fieldName: 'step_number', columnType: 'int' })
  stepNumber!: number;

  @Property({ fieldName: 'event_schema_definition_id', type: 'uuid' }) // FK → telemetry.activity_event_schema_definitions
  eventSchemaDefinitionId!: string;

  @Property({
    fieldName: 'qualification_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  qualificationRuleJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
