import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /authz/patients/{patientProfileId}/break-the-glass` (UC-06-07). */
export class BreakTheGlassDto {
  @ApiProperty({
    description: 'Tenant del acceso de emergencia',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Justificación textual obligatoria',
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  justification!: string;

  @ApiPropertyOptional({
    description:
      'Ventana de acceso en minutos (corta; por defecto 60, máx 240)',
    minimum: 5,
    maximum: 240,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  windowMinutes?: number;

  @ApiPropertyOptional({
    description: 'Encuentro clínico asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;
}
