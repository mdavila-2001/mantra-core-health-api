import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/patients/{profileId}/portal-proxies` (UC-05-11). */
export class GrantPortalProxyDto {
  /**
   * Identificador asociado a proxy user.
   */
  @ApiProperty({
    description: 'Usuario representante al que se delega el acceso',
    format: 'uuid',
  })
  @IsUUID()
  proxyUserId!: string;

  /**
   * Identificador asociado a related person.
   */
  @ApiPropertyOptional({
    description: 'Persona relacionada que respalda el proxy (UC-05-10)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  relatedPersonId?: string;

  /**
   * Identificador asociado a scope value set.
   */
  @ApiProperty({
    description: 'Value set que gobierna el alcance delegado',
    format: 'uuid',
  })
  @IsUUID()
  scopeValueSetId!: string;

  /**
   * Identificador asociado a legal basis record.
   */
  @ApiProperty({
    description: 'Registro de base legal que respalda el acceso',
    format: 'uuid',
  })
  @IsUUID()
  legalBasisRecordId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente desde (ISO date-time)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
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
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a proxy user.
   */
  @ApiProperty({ format: 'uuid' })
  proxyUserId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado del proxy',
    format: 'uuid',
  })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
