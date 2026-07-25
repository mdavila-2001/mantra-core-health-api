import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cómo caduca la autorización: por fecha o por evento descrito. */
export type HipaaExpirationType = 'DATE' | 'EVENT';

/** Cuerpo de `POST /consent/hipaa-authorizations` (UC-07-04). */
export class CreateHipaaAuthorizationDto {
  @ApiProperty({ description: 'Paciente titular (patient profile id)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Propósito de procesamiento activo', format: 'uuid' })
  @IsUUID()
  processingPurposeId!: string;

  @ApiProperty({ description: 'Descripción del destinatario de la divulgación' })
  @IsString()
  @MaxLength(500)
  recipientDescription!: string;

  @ApiProperty({ description: 'Descripción de la información a divulgar' })
  @IsString()
  @MaxLength(4000)
  informationDescription!: string;

  @ApiProperty({ description: 'Tipo de expiración', enum: ['DATE', 'EVENT'] })
  @IsIn(['DATE', 'EVENT'])
  expirationType!: HipaaExpirationType;

  @ApiPropertyOptional({ description: 'Fecha de expiración (ISO-8601) si expirationType=DATE' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Evento de expiración si expirationType=EVENT' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  expirationEventText?: string;

  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
