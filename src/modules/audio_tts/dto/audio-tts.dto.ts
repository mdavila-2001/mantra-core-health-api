import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Contratos HTTP del dominio de audio.
 *
 * **Toda** propiedad lleva al menos un decorador de validación, sin excepción: la
 * `ValidationPipe` global corre con `whitelist` y `forbidNonWhitelisted`, así que
 * una propiedad sin validador no es "un campo sin comprobar" sino un campo que
 * hace fallar la petición entera con 400 — el endpoint quedaría inalcanzable.
 */

/** Petición de resolución de audio. */
export class ResolveAudioDto {
  /**
   * Identificador asociado a template code.
   */
  @ApiProperty({
    description: 'Código de la plantilla, p. ej. onboarding.welcome.named',
    maxLength: 160,
    example: 'onboarding.welcome.named',
  })
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9][a-z0-9._-]*$/u, {
    message:
      'templateCode admite minúsculas, dígitos, punto, guion y guion bajo, empezando por alfanumérico',
  })
  templateCode!: string;

  /**
   * Valores de las variables de la plantilla.
   */
  @ApiPropertyOptional({
    description:
      'Valores de las variables declaradas por la plantilla. Máximo 16, y cada valor pasa una lista blanca de caracteres.',
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { name: 'María' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  // `actorId` **no** es parte de este contrato, y su ausencia es deliberada: el
  // cupo diario se imputa siempre al sujeto del token (`@CurrentUser`). Si el
  // cliente pudiera declararlo, rotar el valor bastaría para saltarse el límite
  // por actor, y ponerle el de otra persona le gastaría su cupo del día. Los
  // llamadores internos que sí necesitan declararlo usan `AudioAssetResolver`
  // directamente por inyección.

  /**
   * Valor de language mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Etiqueta de idioma (BCP-47). Por defecto, la de la plantilla.',
    maxLength: 20,
    example: 'es-419',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    description:
      'Correlación con la petición de origen; viaja hasta el log del worker.',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  correlationId?: string;
}

/** Resultado de una resolución. */
export class ResolveAudioResponseDto {
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'READY (reproducir), QUEUED (seguir sin audio y volver a consultar), FALLBACK (audio genérico) o UNAVAILABLE (seguir sin audio).',
    enum: ['READY', 'QUEUED', 'FALLBACK', 'UNAVAILABLE'],
  })
  @IsString()
  status!: string;

  /**
   * Identificador único de la instancia.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  assetId?: string;

  /**
   * Referencia canónica del audio. No es una URL reproducible: para eso está
   * `playbackUrl`.
   */
  @ApiPropertyOptional({ description: 'URI canónica (s3:// o file://)' })
  @IsOptional()
  @IsString()
  storageUri?: string;

  /**
   * URL firmada y con expiración, lista para reproducir.
   */
  @ApiPropertyOptional({
    description:
      'URL firmada con expiración. Solo se emite si el audio está disponible; caduca, así que no debe persistirse.',
  })
  @IsOptional()
  @IsString()
  playbackUrl?: string;

  /**
   * Valor de cache hit mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si se sirvió de caché sin gastar cuota',
  })
  @IsOptional()
  @IsBoolean()
  cacheHit?: boolean;

  /**
   * Motivo de la degradación (`ACTOR_DAILY_LIMIT`, `MONTHLY_BUDGET_RESERVED`, …).
   */
  @ApiPropertyOptional({
    description: 'Código del motivo cuando hay degradación',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/** Estado de un asset ya conocido. */
export class AudioAssetResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  @IsString()
  assetId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    enum: [
      'PENDING',
      'GENERATING',
      'READY',
      'FAILED_RETRYABLE',
      'FAILED_PERMANENT',
    ],
  })
  @IsString()
  status!: string;

  /**
   * Identificador asociado a template code.
   */
  @ApiProperty()
  @IsString()
  templateCode!: string;

  /**
   * URL firmada, solo si el asset está listo.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  playbackUrl?: string;

  /**
   * Último código de error, si falló.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastErrorCode?: string;
}

/** Pre-generación de una plantilla sin variables. */
export class PrewarmAudioDto {
  /**
   * Identificador asociado a template code.
   */
  @ApiProperty({ maxLength: 160, example: 'onboarding.fallback.generic' })
  @IsString()
  @MaxLength(160)
  templateCode!: string;
}

/** Estado del presupuesto del mes en curso. */
export class AudioBudgetResponseDto {
  /**
   * Valor de provider mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  provider!: string;

  /**
   * Valor de month key mantenido por la instancia.
   */
  @ApiProperty({ example: '2026-08' })
  @IsString()
  monthKey!: string;

  /**
   * Presupuesto gastable: el mensual menos el colchón de seguridad.
   */
  @ApiProperty()
  @IsInt()
  usableUnits!: number;

  /**
   * Valor de reserved units mantenido por la instancia.
   */
  @ApiProperty({ description: 'Unidades apartadas y aún no consumidas' })
  @IsInt()
  reservedUnits!: number;

  /**
   * Valor de settled units mantenido por la instancia.
   */
  @ApiProperty({ description: 'Unidades ya consumidas y confirmadas' })
  @IsInt()
  settledUnits!: number;

  /**
   * Consumo imputado por asset en la ventana (detalle), frente a `settledUnits`
   * (agregado). Si divergen, una liquidación se aplicó sin su registro.
   */
  @ApiProperty({
    description:
      'Unidades imputadas asset por asset en el mes. Debe coincidir con settledUnits; la diferencia es deriva contable.',
  })
  @IsInt()
  recordedUnits!: number;

  /**
   * Número de generaciones facturables registradas en la ventana.
   */
  @ApiProperty({ description: 'Generaciones facturadas en el mes' })
  @IsInt()
  recordedGenerations!: number;

  /**
   * Recuento de assets por estado.
   */
  @ApiProperty({
    description:
      'Assets por estado; una cola PENDING que crece indica worker parado',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  @IsObject()
  assetsByStatus!: Record<string, number>;
}

/** Reclamo de trabajos por parte del worker. */
export class ClaimAudioJobsDto {
  /**
   * Identificador asociado a worker.
   */
  @ApiProperty({
    description:
      'Identificador del proceso worker; queda en el lease para diagnóstico.',
    maxLength: 120,
  })
  @IsString()
  @MaxLength(120)
  workerId!: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Trabajos a reclamar. Se acota al lote configurado: un worker no puede pedir más de lo que el mamparo del proveedor admite.',
    minimum: 1,
    maximum: 64,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(64)
  limit?: number;
}

/** Un trabajo de generación, con el texto ya descifrado. */
export class AudioGenerationJobDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  @IsString()
  assetId!: string;

  /**
   * Texto a sintetizar.
   */
  @ApiProperty({ description: 'Texto renderizado, descifrado por la API' })
  @IsString()
  text!: string;

  /**
   * Valor de language mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  language!: string;

  /**
   * Referencia de voz del proveedor.
   */
  @ApiProperty()
  @IsString()
  providerVoiceRef!: string;

  /**
   * Valor de model mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  model!: string;

  /**
   * Valor de output format mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  outputFormat!: string;

  /**
   * Valor de sample rate mantenido por la instancia.
   */
  @ApiProperty()
  @IsInt()
  sampleRate!: number;

  /**
   * Intentos ya consumidos, incluido el actual.
   */
  @ApiProperty()
  @IsInt()
  attempts!: number;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correlationId?: string;
}

/** Lote entregado al worker. */
export class ClaimAudioJobsResponseDto {
  /**
   * Trabajos entregados.
   */
  @ApiProperty({ type: [AudioGenerationJobDto] })
  @IsObject({ each: true })
  jobs!: AudioGenerationJobDto[];

  /**
   * Assets reclamados que no se entregaron y quedaron cerrados (presupuesto
   * agotado, texto ilegible).
   */
  @ApiProperty({
    description:
      'Assets reclamados que se cerraron sin generar: presupuesto agotado o texto no descifrable.',
  })
  @IsInt()
  skipped!: number;
}

/** Resultado correcto reportado por el worker. */
export class CompleteAudioAssetDto {
  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @ApiProperty({ description: 'URI canónica devuelta por el almacenamiento' })
  @IsString()
  @MaxLength(1024)
  storageUri!: string;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @ApiProperty({ example: 'audio/mpeg' })
  @IsString()
  @MaxLength(128)
  mimeType!: string;

  /**
   * Valor de checksum sha256 mantenido por la instancia.
   */
  @ApiProperty({ description: 'SHA-256 hexadecimal del contenido almacenado' })
  @IsString()
  @Matches(/^[0-9a-f]{64}$/u, { message: 'checksumSha256 debe ser 64 hex' })
  checksumSha256!: string;

  /**
   * Valor de bytes mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  bytes!: number;

  /**
   * Unidades facturables consumidas.
   */
  @ApiProperty({
    minimum: 0,
    description: 'Unidades reportadas por el proveedor o estimadas',
  })
  @IsInt()
  @Min(0)
  usageUnits!: number;

  /**
   * Valor de provider mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MaxLength(40)
  provider!: string;
}

/** Fallo reportado por el worker. */
export class FailAudioAssetDto {
  /**
   * Código estable del fallo.
   */
  @ApiProperty({ maxLength: 120, example: 'ELEVENLABS_HTTP_429' })
  @IsString()
  @MaxLength(120)
  code!: string;

  /**
   * ¿Merece la pena reintentar?
   */
  @ApiProperty({
    description:
      'true solo si el fallo puede curarse solo. Un 401 reintentado no arregla la credencial y sí gasta los intentos del asset.',
  })
  @IsBoolean()
  retryable!: boolean;
}

/** Confirmación de un reporte del worker. */
export class AudioAssetOutcomeResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  @IsString()
  assetId!: string;

  /**
   * Estado resultante.
   */
  @ApiProperty()
  @IsString()
  status!: string;

  /**
   * `false` cuando el reporte era un duplicado y no cambió nada.
   */
  @ApiProperty({
    description:
      'false si el asset ya estaba READY: el reporte es un duplicado benigno',
  })
  @IsBoolean()
  applied!: boolean;
}

/** Resultado del barrido de reconciliación. */
export class AudioReconcileResponseDto {
  /**
   * Assets cerrados por agotar intentos.
   */
  @ApiProperty()
  @IsInt()
  exhausted!: number;

  /**
   * Unidades devueltas al presupuesto.
   */
  @ApiProperty()
  @IsInt()
  releasedUnits!: number;

  /**
   * Filas del contador por actor borradas por retención.
   */
  @ApiProperty()
  @IsInt()
  purgedActorDays!: number;

  /**
   * Assets pendientes sin progreso pasado el umbral.
   */
  @ApiProperty({
    description:
      'Pendientes sin progreso: si crece, el worker no está drenando',
  })
  @IsInt()
  stalled!: number;
}
