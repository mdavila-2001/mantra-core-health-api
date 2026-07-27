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
  @ApiPropertyOptional({
    description: 'Journey de sesión existente a enlazar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  @ApiPropertyOptional({
    description: 'Sesión (se usa para crear el journey si no existe)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Sujeto de analítica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  analyticsSubjectId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de portal (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de dispositivo (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deviceTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Familia de SO (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  osFamilyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Familia de navegador (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  browserFamilyConceptId?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  screenClass?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  viewportBucket?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  timezoneOffsetMinutes?: number;

  @ApiPropertyOptional({ description: 'País (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  regionCoarse?: string;

  @ApiPropertyOptional({
    description: 'Hash del prefijo de IP',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ipPrefixHash?: string;

  @ApiPropertyOptional({ description: 'Hash del user agent', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  userAgentHash?: string;

  @ApiPropertyOptional({ description: 'Marcado como bot' })
  @IsOptional()
  @IsBoolean()
  isBot?: boolean;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Journey de sesión creado o enlazado',
  })
  sessionJourneyId!: string;

  @ApiProperty()
  createdAt!: Date;
}
