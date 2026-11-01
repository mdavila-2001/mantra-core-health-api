import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `audio_assets`.
 */
@Entity({ schema: 'audio_assets', tableName: 'audio_assets' })
export class AudioAssets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de asset key mantenido por la instancia.
   */
  @Property({ fieldName: 'asset_key', columnType: 'char(64)' })
  assetKey!: string;

  /**
   * Tenant propietario, o `NULL` cuando el audio es compartido por la plataforma.
   *
   * Sólo lo llevan los assets cuyo texto renderizado incluye un valor dinámico
   * que puede identificar a una persona (`PERSON_NAME`, `SAFE_TEXT`). Los
   * `STATIC`, los `FALLBACK` y los `ENUMERATED` —conjunto cerrado— siguen siendo
   * compartidos, que es lo que permite pre-generarlos una sola vez para todos.
   *
   * Entra además en `asset_key` y en la búsqueda de binario reutilizable: sin eso,
   * dos tenants compartirían la fila del audio del nombre de un paciente y un
   * acierto de caché delataría que ese nombre existe en el otro tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de template key mantenido por la instancia.
   */
  @Property({ fieldName: 'template_key', columnType: 'varchar' })
  templateKey!: string;

  /**
   * Valor de template version mantenido por la instancia.
   */
  @Property({ fieldName: 'template_version', columnType: 'int' })
  templateVersion!: number;

  /**
   * Valor de strategy mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  strategy!: string;

  /**
   * Valor de language mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  language!: string;

  /**
   * Valor de normalized value hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'normalized_value_hash',
    columnType: 'char(64)',
    nullable: true,
  })
  normalizedValueHash?: string;

  /**
   * Valor de display value encrypted mantenido por la instancia.
   */
  @Property({ fieldName: 'display_value_encrypted', columnType: 'text' })
  displayValueEncrypted!: string;

  /**
   * Valor de rendered text hash mantenido por la instancia.
   */
  @Property({ fieldName: 'rendered_text_hash', columnType: 'char(64)' })
  renderedTextHash!: string;

  /**
   * Valor de provider mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  provider!: string;

  /**
   * Valor de provider model mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_model', columnType: 'varchar' })
  providerModel!: string;

  /**
   * Valor de voice profile mantenido por la instancia.
   */
  @Property({ fieldName: 'voice_profile', columnType: 'varchar' })
  voiceProfile!: string;

  /**
   * Valor de voice provider ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'voice_provider_ref',
    columnType: 'varchar',
    nullable: true,
  })
  voiceProviderRef?: string;

  /**
   * Valor de voice version mantenido por la instancia.
   */
  @Property({ fieldName: 'voice_version', columnType: 'int' })
  voiceVersion!: number;

  /**
   * Valor de normalizer version mantenido por la instancia.
   */
  @Property({ fieldName: 'normalizer_version', columnType: 'int' })
  normalizerVersion!: number;

  /**
   * Valor de audio format mantenido por la instancia.
   */
  @Property({ fieldName: 'audio_format', columnType: 'varchar' })
  audioFormat!: string;

  /**
   * Valor de sample rate mantenido por la instancia.
   */
  @Property({ fieldName: 'sample_rate', columnType: 'int', nullable: true })
  sampleRate?: number;

  /**
   * Valor de storage provider mantenido por la instancia.
   */
  @Property({
    fieldName: 'storage_provider',
    columnType: 'varchar',
    nullable: true,
  })
  storageProvider?: string;

  /**
   * Valor de storage key mantenido por la instancia.
   */
  @Property({ fieldName: 'storage_key', columnType: 'varchar', nullable: true })
  storageKey?: string;

  /**
   * Valor de bytes mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  bytes?: number;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

  /**
   * Valor de checksum sha256 mantenido por la instancia.
   */
  @Property({
    fieldName: 'checksum_sha256',
    columnType: 'char(64)',
    nullable: true,
  })
  checksumSha256?: string;

  /**
   * Valor de generation status mantenido por la instancia.
   */
  @Property({ fieldName: 'generation_status', columnType: 'varchar' })
  generationStatus!: string;

  /**
   * Valor de failure code mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_code',
    columnType: 'varchar',
    nullable: true,
  })
  failureCode?: string;

  /**
   * Valor de budget reserved units mantenido por la instancia.
   */
  @Property({
    fieldName: 'budget_reserved_units',
    columnType: 'int',
    nullable: true,
  })
  budgetReservedUnits?: number;

  /**
   * Ventana mensual (`YYYY-MM`) contra la que se apartó la reserva.
   *
   * Se persiste porque la liquidación y la devolución ocurren **después**, y
   * pueden caer en otro mes: un asset que reserva el día 31 y se genera el 1
   * imputaría su consumo a una ventana sin fila de reserva —el `UPDATE` no
   * afectaría ninguna fila, el consumo se perdería y el mes anterior se quedaría
   * con crédito apartado para siempre—.
   */
  @Property({
    fieldName: 'budget_period_key',
    columnType: 'varchar(7)',
    nullable: true,
  })
  budgetPeriodKey?: string;

  /**
   * Valor de generated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'generated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  generatedAt?: Date;

  /**
   * Valor de last used at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_used_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastUsedAt?: Date;

  /**
   * Valor de use count mantenido por la instancia.
   */
  @Property({ fieldName: 'use_count', columnType: 'int' })
  useCount!: number;

  /**
   * Valor de metadata mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  metadata!: unknown;

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
}
