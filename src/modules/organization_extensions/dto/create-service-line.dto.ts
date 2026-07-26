import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /orgext/hospitals/{id}/service-lines` (UC-22-03). */
export class CreateServiceLineDto {
  @ApiPropertyOptional({ description: 'Unidad clínica asociada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({ description: 'Servicio de salud asociado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  @ApiPropertyOptional({ description: 'Línea de servicio (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceLineConceptId?: string;

  @ApiPropertyOptional({ description: 'Especialidad (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ description: 'Nivel de agudeza (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  acuityLevelConceptId?: string;

  @ApiPropertyOptional({ description: 'Requiere referencia/derivación' })
  @IsOptional()
  @IsBoolean()
  referralRequired?: boolean;
}
