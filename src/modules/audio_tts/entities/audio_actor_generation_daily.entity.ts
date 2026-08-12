import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Contador diario de generaciones por actor
 * (`audio_tts.audio_actor_generation_daily`).
 *
 * Acota lo que una sola cuenta puede gastar en un día. La clave primaria es
 * `actorId:dayKey` compuesta como texto —y no un uuid con un UNIQUE aparte—
 * porque el incremento tiene que ser un `INSERT … ON CONFLICT (key) DO UPDATE`
 * con el límite en el `WHERE`: es lo que hace que N peticiones simultáneas del
 * mismo actor no puedan superar el techo, algo que un `SELECT` seguido de un
 * `UPDATE` no garantiza.
 *
 * Contiene un identificador de persona, así que tiene retención: el barrido de
 * `AudioReconcileService` borra los días anteriores a
 * `AUDIO_RETENTION_ACTOR_DAILY_DAYS`.
 */
@Entity({ schema: 'audio_tts', tableName: 'audio_actor_generation_daily' })
export class AudioActorGenerationDaily {
  /**
   * Clave compuesta `actorId:dayKey`.
   */
  @PrimaryKey({ columnType: 'varchar(200)' })
  key!: string;

  /**
   * Identificador asociado a actor.
   */
  @Property({ fieldName: 'actor_id', columnType: 'varchar(160)' })
  actorId!: string;

  /**
   * Día de imputación (`YYYY-MM-DD`), en UTC.
   */
  @Property({ fieldName: 'day_key', columnType: 'varchar(10)' })
  dayKey!: string;

  /**
   * Valor de generation count mantenido por la instancia.
   */
  @Property({ fieldName: 'generation_count', columnType: 'int', default: 0 })
  generationCount: number = 0;
}
