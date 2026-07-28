import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `automation_triggers`.
 */
@Entity({ schema: 'automation', tableName: 'automation_triggers' })
export class AutomationTriggers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a trigger type concept.
   */
  @Property({ fieldName: 'trigger_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerTypeConceptId!: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @Property({ fieldName: 'event_type', columnType: 'varchar', nullable: true })
  eventType?: string;

  /**
   * Valor de target resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'target_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  targetResourceType?: string;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /**
   * Valor de schedule cron mantenido por la instancia.
   */
  @Property({
    fieldName: 'schedule_cron',
    columnType: 'varchar',
    nullable: true,
  })
  scheduleCron?: string;

  /**
   * Identificador asociado a workflow.
   */
  @Property({ fieldName: 'workflow_id', type: 'uuid' }) // FK → automation.workflows
  workflowId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /**
   * Identificador asociado a campaign schedule.
   */
  @Property({ fieldName: 'campaign_schedule_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_schedules
  campaignScheduleId?: string;

  /**
   * Identificador asociado a schedule source concept.
   */
  @Property({ fieldName: 'schedule_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scheduleSourceConceptId!: string;
}
