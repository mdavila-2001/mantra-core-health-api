import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /telemetry/client-contexts` (UC-28-08). Solo hashes y buckets. */
export class CreateClientContextDto {
  /**
   * Identificador asociado a session journey.
   */
  @ApiPropertyOptional({
    description: 'Journey de sesión existente a enlazar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  /**
   * Identificador asociado a session.
   */
  @ApiPropertyOptional({
    description: 'Sesión (se usa para crear el journey si no existe)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @ApiPropertyOptional({ description: 'Sujeto de analítica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  analyticsSubjectId?: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de portal (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  /**
   * Identificador asociado a device type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de dispositivo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deviceTypeConceptId?: string;

  /**
   * Identificador asociado a os family concept.
   */
  @ApiPropertyOptional({
    description: 'Familia de SO (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  osFamilyConceptId?: string;

  /**
   * Identificador asociado a browser family concept.
   */
  @ApiPropertyOptional({
    description: 'Familia de navegador (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  browserFamilyConceptId?: string;

  /**
   * Valor de app version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;

  /**
   * Valor de screen class mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  screenClass?: string;

  /**
   * Valor de viewport bucket mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  viewportBucket?: string;

  /**
   * Valor de locale mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  /**
   * Valor de timezone offset minutes mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  timezoneOffsetMinutes?: number;

  /**
   * Identificador asociado a country concept.
   */
  @ApiPropertyOptional({ description: 'País (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Valor de region coarse mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  regionCoarse?: string;

  /**
   * Valor de ip prefix hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del prefijo de IP',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ipPrefixHash?: string;

  /**
   * Valor de user agent hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash del user agent', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userAgentHash?: string;

  /**
   * Valor de is bot mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marcado como bot' })
  @IsOptional()
  @IsBoolean()
  isBot?: boolean;

  /**
   * Identificador asociado a data classification concept.
   */
  @ApiPropertyOptional({
    description: 'Clasificación de dato (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataClassificationConceptId?: string;
}

/** Respuesta de la captura de contexto de cliente. */
export class ClientContextResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a session journey.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Journey de sesión creado o enlazado',
  })
  sessionJourneyId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
