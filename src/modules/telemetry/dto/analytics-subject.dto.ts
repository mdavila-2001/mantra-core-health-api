import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

/** Cuerpo de `POST /telemetry/analytics-subjects` (UC-28-06, interno del worker). */
export class ProvisionAnalyticsSubjectDto {
  @ApiPropertyOptional({
    description: 'Clave pseudónima (HMAC). Si se omite se genera de forma determinista.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pseudonymousSubjectKey?: string;

  @ApiPropertyOptional({ description: 'Versión de la clave de derivación', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  keyVersion?: number;

  @ApiPropertyOptional({ description: 'Usuario asociado (opcional)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Perfil de paciente asociado (opcional)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ description: 'Consentimiento que originó el sujeto', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  createdFromConsentId?: string;
}

/** Respuesta de un sujeto de analítica pseudónimo. */
export class AnalyticsSubjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Clave pseudónima del sujeto' })
  pseudonymousSubjectKey!: string;

  @ApiPropertyOptional()
  keyVersion?: number;

  @ApiProperty({ description: 'true si el sujeto ya existía (idempotente)' })
  reused!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
