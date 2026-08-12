import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Audio sintetizado y su ciclo de vida (`audio_tts.audio_assets`).
 *
 * La fila **es la cola**: no hay broker aparte. `status`, `attempts`,
 * `claimed_at`/`claimed_by` y `next_attempt_at` son el estado completo de un
 * trabajo, y el worker lo reclama con un `UPDATE … RETURNING` condicionado por
 * el lease (ver `AudioAssetsRepository.claimBatch`). Es la misma mecánica de
 * `SKIP LOCKED` + tiempo de visibilidad que ya usan `messaging.message_queues` y
 * el relevo del outbox en este backend, y evita introducir un segundo sistema de
 * colas —con su propio esquema, su propio apagado y su propia observabilidad—
 * para una tabla que ya tenía que llevar la cuenta de los intentos de todos
 * modos.
 *
 * `asset_key` es la identidad criptográfica del render (texto + idioma + voz +
 * modelo + formato + tenant). Su UNIQUE es lo que convierte dos peticiones
 * concurrentes del mismo audio en una sola generación: la segunda choca con la
 * restricción y se adhiere al asset existente en vez de pagar otra vez.
 */
@Entity({ schema: 'audio_tts', tableName: 'audio_assets' })
export class AudioAssets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Huella SHA-256 de todas las dimensiones que definen el audio. UNIQUE: ver
   * el catálogo de índices.
   */
  @Property({ fieldName: 'asset_key', columnType: 'varchar(64)' })
  assetKey!: string;

  /**
   * Tenant propietario, o `NULL` en los assets compartidos por la plataforma.
   *
   * Los `STATIC` y `FALLBACK` no dependen de nadie, así que se comparten
   * (`NULL`) y se pre-generan una sola vez. Los `DYNAMIC` sí lo llevan: su texto
   * renderizado puede contener el nombre de una persona, y una caché compartida
   * entre tenants haría que un acierto de caché revelara que ese nombre existe
   * en otro tenant. El tenant entra además en `asset_key`, de modo que el
   * aislamiento no depende de recordar filtrar en cada consulta.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a template code.
   */
  @Property({ fieldName: 'template_code', columnType: 'varchar(160)' }) // FK → audio_tts.audio_templates
  templateCode!: string;

  /**
   * Valor de template version mantenido por la instancia.
   */
  @Property({ fieldName: 'template_version', columnType: 'int' })
  templateVersion!: number;

  /**
   * Estado del ciclo de vida. Restringido por CHECK en base.
   */
  @Property({ columnType: 'varchar(32)' })
  status!: string;

  /**
   * Texto renderizado, cifrado con AES-256-GCM y `asset_key` como dato
   * autenticado adicional. Nunca se persiste en claro: puede contener el nombre
   * de un paciente, y una tabla de caché no es sitio para un dato personal
   * legible.
   */
  @Property({ fieldName: 'rendered_text_encrypted', columnType: 'text' })
  renderedTextEncrypted!: string;

  /**
   * Valor de language mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(20)' })
  language!: string;

  /**
   * Valor de provider mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(40)' })
  provider!: string;

  /**
   * Modelo exacto con el que se pidió el audio. Se guarda en la fila —y no se
   * lee de la configuración al generar— porque la configuración puede cambiar
   * entre el encolado y la generación.
   */
  @Property({ fieldName: 'provider_model', columnType: 'varchar(128)' })
  providerModel!: string;

  /**
   * Referencia de voz del proveedor.
   */
  @Property({ fieldName: 'provider_voice_ref', columnType: 'varchar(255)' })
  providerVoiceRef!: string;

  /**
   * Perfil de voz de marca, independiente del identificador del proveedor.
   */
  @Property({ fieldName: 'voice_profile', columnType: 'varchar(100)' })
  voiceProfile!: string;

  /**
   * Valor de voice version mantenido por la instancia.
   */
  @Property({ fieldName: 'voice_version', columnType: 'int' })
  voiceVersion!: number;

  /**
   * Valor de output format mantenido por la instancia.
   */
  @Property({ fieldName: 'output_format', columnType: 'varchar(64)' })
  outputFormat!: string;

  /**
   * Valor de sample rate mantenido por la instancia.
   */
  @Property({ fieldName: 'sample_rate', columnType: 'int' })
  sampleRate!: number;

  /**
   * Unidades apartadas del presupuesto al autorizar. Se convierten en consumo
   * real al terminar (`settle`) o se devuelven si el asset muere (`release`).
   */
  @Property({ fieldName: 'reserved_units', columnType: 'int', default: 0 })
  reservedUnits: number = 0;

  /**
   * Intentos consumidos. Es el techo que cierra un asset irrecuperable.
   */
  @Property({ columnType: 'int', default: 0 })
  attempts: number = 0;

  /**
   * Correlación con la petición que lo originó; viaja hasta el log del worker.
   */
  @Property({
    fieldName: 'correlation_id',
    columnType: 'varchar(64)',
    nullable: true,
  })
  correlationId?: string;

  /**
   * Instante en que un worker tomó el lease. Su antigüedad es lo que permite
   * recuperar un asset cuyo worker murió a mitad de la generación.
   */
  @Property({
    fieldName: 'claimed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  claimedAt?: Date;

  /**
   * Quién sostiene el lease (`host:pid`). Solo para diagnóstico.
   */
  @Property({
    fieldName: 'claimed_by',
    columnType: 'varchar(120)',
    nullable: true,
  })
  claimedBy?: string;

  /**
   * No reclamar antes de este instante.
   *
   * Es el backoff que en la versión con broker aportaba la cola durable. Sin él,
   * un asset que falla de forma transitoria se volvería a reclamar en el tick
   * siguiente —cinco segundos después— y quemaría sus cuatro intentos contra un
   * proveedor que todavía está caído.
   */
  @Property({
    fieldName: 'next_attempt_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextAttemptAt?: Date;

  /**
   * Referencia canónica del audio almacenado. Un asset `READY` la tiene siempre
   * (CHECK en base).
   */
  @Property({ fieldName: 'storage_uri', columnType: 'text', nullable: true })
  storageUri?: string;

  /**
   * Tipo real que devolvió el proveedor.
   */
  @Property({
    fieldName: 'mime_type',
    columnType: 'varchar(128)',
    nullable: true,
  })
  mimeType?: string;

  /**
   * Checksum del contenido almacenado, para detectar corrupción silenciosa.
   */
  @Property({
    fieldName: 'checksum_sha256',
    columnType: 'varchar(64)',
    nullable: true,
  })
  checksumSha256?: string;

  /**
   * Tamaño en bytes.
   *
   * `int` y no `bigint` a propósito: el techo de respuesta del proveedor está
   * acotado por `AUDIO_TTS_MAX_RESPONSE_BYTES` (10 MiB por defecto, máximo 256
   * MiB), muy por debajo de int4, y `bigint` en MikroORM se materializa como
   * `string` en JavaScript —un tipo con el que ninguna comparación numérica
   * funciona como parece.
   */
  @Property({ columnType: 'int', nullable: true })
  bytes?: number;

  /**
   * Último código de error. Es lo que explica un `FAILED_*` sin tener que
   * cruzar logs.
   */
  @Property({
    fieldName: 'last_error_code',
    columnType: 'varchar(120)',
    nullable: true,
  })
  lastErrorCode?: string;

  /**
   * Valor de created at mantenido por la instancia.
   */
  @Property({
    fieldName: 'created_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  /**
   * Valor de updated at mantenido por la instancia. Lo mantiene el trigger
   * `audio_tts.touch_updated_at`, no la aplicación: el reconciliador y el claim
   * escriben por SQL directo.
   */
  @Property({
    fieldName: 'updated_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  updatedAt: Date = new Date();
}
