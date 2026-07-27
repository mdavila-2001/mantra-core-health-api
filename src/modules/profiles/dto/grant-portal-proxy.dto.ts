import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/patients/{profileId}/portal-proxies` (UC-05-11). */
export class GrantPortalProxyDto {
  @ApiProperty({
    description: 'Usuario representante al que se delega el acceso',
    format: 'uuid',
  })
  @IsUUID()
  proxyUserId!: string;

  @ApiPropertyOptional({
    description: 'Persona relacionada que respalda el proxy (UC-05-10)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  relatedPersonId?: string;

  @ApiProperty({
    description: 'Value set que gobierna el alcance delegado',
    format: 'uuid',
  })
  @IsUUID()
  scopeValueSetId!: string;

  @ApiProperty({
    description: 'Registro de base legal que respalda el acceso',
    format: 'uuid',
  })
  @IsUUID()
  legalBasisRecordId!: string;

  @ApiPropertyOptional({
    description: 'Vigente desde (ISO date-time)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Vigente hasta (ISO date-time)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Respuesta de otorgamiento de proxy de portal. */
export class PortalProxyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  proxyUserId!: string;

  @ApiProperty({
    description: 'Concept id del estado del proxy',
    format: 'uuid',
  })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
