import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/** Cuerpo de `POST /telemetry/analytics-subjects` (UC-28-06, interno del worker). */
export class ProvisionAnalyticsSubjectDto {
  /**
   * Valor de pseudonymous subject key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Clave pseudónima (HMAC). Si se omite se genera de forma determinista.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pseudonymousSubjectKey?: string;

  /**
   * Valor de key version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de la clave de derivación',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  keyVersion?: number;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    description: 'Usuario asociado (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil de paciente asociado (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a created from consent.
   */
  @ApiPropertyOptional({
    description: 'Consentimiento que originó el sujeto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  createdFromConsentId?: string;
}

/** Respuesta de un sujeto de analítica pseudónimo. */
export class AnalyticsSubjectResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de pseudonymous subject key mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clave pseudónima del sujeto' })
  pseudonymousSubjectKey!: string;

  /**
   * Valor de key version mantenido por la instancia.
   */
  @ApiPropertyOptional()
  keyVersion?: number;

  /**
   * Valor de reused mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el sujeto ya existía (idempotente)' })
  reused!: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
