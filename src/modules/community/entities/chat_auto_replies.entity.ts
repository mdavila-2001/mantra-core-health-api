import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * La respuesta automática por inactividad de un perfil público (F4.7).
 *
 * **Una fila por perfil** (`ux_chat_auto_replies_public_profile_id`): es una
 * preferencia de la persona, no de una conversación. El descanso entre avisos
 * sí es por conversación, y vive en
 * `conversation_participants.last_auto_reply_at`.
 */
@Entity({ schema: 'community', tableName: 'chat_auto_replies' })
export class ChatAutoReplies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * De quién es esta configuración.
   */
  @Property({ fieldName: 'public_profile_id', type: 'uuid' }) // FK → community.public_profiles
  publicProfileId!: string;

  /** Si contestar solo. Apagada, nada de lo demás importa. */
  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

  /**
   * Cuántos minutos sin actividad del titular hacen falta para contestar solo.
   */
  @Property({ fieldName: 'inactivity_minutes', type: 'integer' })
  inactivityMinutes!: number;

  /** Lo que se contesta. */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  /**
   * Cuántas horas esperar antes de volver a avisarle a la misma conversación.
   */
  @Property({ fieldName: 'cooldown_hours', type: 'integer' })
  cooldownHours!: number;

  /** Si sólo contestar fuera de la franja declarada abajo. */
  @Property({ fieldName: 'only_outside_business_hours', type: 'boolean' })
  onlyOutsideBusinessHours!: boolean;

  /**
   * Desde qué hora atiende, `HH:MM`.
   *
   * `columnType: 'time'` y no una fecha: es una hora del día, sin día ni zona.
   * Viaja como texto, que es lo que devuelve Postgres para `time`.
   */
  @Property({
    fieldName: 'business_hours_from',
    columnType: 'time',
    nullable: true,
  })
  businessHoursFrom?: string;

  /**
   * Hasta qué hora atiende, `HH:MM`.
   *
   * **Puede ser menor que `businessHoursFrom`**: eso significa que la franja
   * cruza la medianoche, que es el turno noche y no un error.
   */
  @Property({
    fieldName: 'business_hours_to',
    columnType: 'time',
    nullable: true,
  })
  businessHoursTo?: string;

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
