import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `report_distributions`.
 */
@Entity({ schema: 'reporting', tableName: 'report_distributions' })
export class ReportDistributions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a schedule.
   */
  @Property({ fieldName: 'schedule_id', type: 'uuid', nullable: true }) // FK → reporting.report_schedules
  scheduleId?: string;

  /**
   * Identificador asociado a report execution.
   */
  @Property({ fieldName: 'report_execution_id', type: 'uuid', nullable: true }) // FK → reporting.report_executions
  reportExecutionId?: string;

  /**
   * Identificador asociado a recipient type concept.
   */
  @Property({ fieldName: 'recipient_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recipientTypeConceptId!: string;

  /**
   * Identificador asociado a recipient user.
   */
  @Property({ fieldName: 'recipient_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recipientUserId?: string;

  /**
   * Valor de recipient address mantenido por la instancia.
   */
  @Property({
    fieldName: 'recipient_address',
    columnType: 'varchar',
    nullable: true,
  })
  recipientAddress?: string;

  /**
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

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
