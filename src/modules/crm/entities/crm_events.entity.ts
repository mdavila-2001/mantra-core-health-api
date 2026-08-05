import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_events`.
 */
@Entity({ schema: 'crm', tableName: 'crm_events' })
export class CrmEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm activity.
   */
  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  /**
   * Identificador asociado a event subtype concept.
   */
  @Property({ fieldName: 'event_subtype_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventSubtypeConceptId!: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  /**
   * Valor de is all day mantenido por la instancia.
   */
  @Property({ fieldName: 'is_all_day', type: 'boolean', nullable: true })
  isAllDay?: boolean;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  /**
   * Valor de location text mantenido por la instancia.
   */
  @Property({
    fieldName: 'location_text',
    columnType: 'varchar',
    nullable: true,
  })
  locationText?: string;

  /**
   * Valor de meeting url mantenido por la instancia.
   */
  @Property({ fieldName: 'meeting_url', columnType: 'varchar', nullable: true })
  meetingUrl?: string;

  /**
   * Identificador asociado a organizer user.
   */
  @Property({ fieldName: 'organizer_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  organizerUserId?: string;

  /**
   * Identificador asociado a recurrence rule.
   */
  @Property({ fieldName: 'recurrence_rule_id', type: 'uuid', nullable: true }) // FK → crm.crm_recurrence_rules
  recurrenceRuleId?: string;

  /**
   * Identificador asociado a parent event.
   */
  @Property({ fieldName: 'parent_event_id', type: 'uuid', nullable: true }) // FK → crm.crm_events
  parentEventId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
