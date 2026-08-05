import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `funnel_steps`.
 */
@Entity({ schema: 'telemetry', tableName: 'funnel_steps' })
export class FunnelSteps {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a funnel definition.
   */
  @Property({ fieldName: 'funnel_definition_id', type: 'uuid' }) // FK → telemetry.funnel_definitions
  funnelDefinitionId!: string;

  /**
   * Valor de step number mantenido por la instancia.
   */
  @Property({ fieldName: 'step_number', columnType: 'int' })
  stepNumber!: number;

  /**
   * Identificador asociado a event schema definition.
   */
  @Property({ fieldName: 'event_schema_definition_id', type: 'uuid' }) // FK → telemetry.activity_event_schema_definitions
  eventSchemaDefinitionId!: string;

  /**
   * Valor de qualification rule json mantenido por la instancia.
   */
  @Property({
    fieldName: 'qualification_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  qualificationRuleJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
