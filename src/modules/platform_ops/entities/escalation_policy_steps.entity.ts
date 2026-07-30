import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `escalation_policy_steps`.
 */
@Entity({ schema: 'platform_ops', tableName: 'escalation_policy_steps' })
export class EscalationPolicySteps {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a escalation policy.
   */
  @Property({ fieldName: 'escalation_policy_id', type: 'uuid' }) // FK → platform_ops.escalation_policies
  escalationPolicyId!: string;

  /**
   * Valor de step number mantenido por la instancia.
   */
  @Property({ fieldName: 'step_number', columnType: 'int' })
  stepNumber!: number;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  /**
   * Identificador asociado a operational team.
   */
  @Property({ fieldName: 'operational_team_id', type: 'uuid', nullable: true }) // FK → platform_ops.operational_teams
  operationalTeamId?: string;

  /**
   * Identificador asociado a on call schedule.
   */
  @Property({ fieldName: 'on_call_schedule_id', type: 'uuid', nullable: true }) // FK → platform_ops.on_call_schedules
  onCallScheduleId?: string;

  /**
   * Identificador asociado a target user.
   */
  @Property({ fieldName: 'target_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  targetUserId?: string;

  /**
   * Valor de delay seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'delay_seconds', columnType: 'int' })
  delaySeconds!: number;

  /**
   * Valor de notification channels json mantenido por la instancia.
   */
  @Property({
    fieldName: 'notification_channels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  notificationChannelsJson?: unknown;

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
}
