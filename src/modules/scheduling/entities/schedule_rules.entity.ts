import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `schedule_rules`.
 */
@Entity({ schema: 'scheduling', tableName: 'schedule_rules' })
export class ScheduleRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a schedule template.
   */
  @Property({ fieldName: 'schedule_template_id', type: 'uuid' }) // FK → scheduling.schedule_templates
  scheduleTemplateId!: string;

  /**
   * Valor de day of week mantenido por la instancia.
   */
  @Property({ fieldName: 'day_of_week', columnType: 'int' })
  dayOfWeek!: number;

  /**
   * Valor de start time mantenido por la instancia.
   */
  @Property({ fieldName: 'start_time', columnType: 'time' })
  startTime!: string;

  /**
   * Valor de end time mantenido por la instancia.
   */
  @Property({ fieldName: 'end_time', columnType: 'time' })
  endTime!: string;

  /**
   * Valor de slot minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'slot_minutes', columnType: 'int', nullable: true })
  slotMinutes?: number;

  /**
   * Valor de capacity per slot mantenido por la instancia.
   */
  @Property({
    fieldName: 'capacity_per_slot',
    columnType: 'int',
    nullable: true,
  })
  capacityPerSlot?: number;

  /**
   * Receso entre consultas de esta franja, en minutos (v4.2.2).
   *
   * El paso del generador de cupos es `slotMinutes + gapMinutes`, pero cada turno
   * sigue midiendo su duración real: el respiro es aire del profesional, no un cupo
   * que alguien pueda reservar.
   *
   * `undefined` ≡ sin respiro: nullable y sin default, como `slotMinutes`. El `?? 0`
   * lo pone el servicio.
   */
  @Property({ fieldName: 'gap_minutes', columnType: 'int', nullable: true })
  gapMinutes?: number;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
