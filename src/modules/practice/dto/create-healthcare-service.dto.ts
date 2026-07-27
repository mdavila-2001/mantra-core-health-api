import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/healthcare-services` (UC-14-06). */
export class CreateHealthcareServiceDto {
  @ApiPropertyOptional({ description: 'Sitio donde se presta', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiPropertyOptional({
    description: 'Unidad clínica que lo presta',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({ description: 'Concepto de servicio', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concepto de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ description: '¿Requiere derivación?' })
  @IsOptional()
  @IsBoolean()
  referralRequired?: boolean;

  @ApiPropertyOptional({ description: '¿Requiere cita?' })
  @IsOptional()
  @IsBoolean()
  appointmentRequired?: boolean;

  @ApiPropertyOptional({ description: '¿Disponible por telesalud?' })
  @IsOptional()
  @IsBoolean()
  telehealthAvailable?: boolean;
}
