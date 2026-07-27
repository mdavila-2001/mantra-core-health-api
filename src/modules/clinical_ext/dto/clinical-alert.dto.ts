import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `PATCH /clinical-alerts/{id}/override` (UC-18-05). */
export class OverrideAlertDto {
  @ApiPropertyOptional({
    description:
      'Motivo del override (obligatorio para alertas de alta severidad)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

/** Respuesta tras reconocer u override de una alerta clínica. */
export class ClinicalAlertResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado de la alerta (concept id)',
  })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  overriddenAt?: Date;
}
