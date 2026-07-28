import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /orgext/hospitals/{id}/service-lines` (UC-22-03). */
export class CreateServiceLineDto {
  /**
   * Identificador asociado a clinical unit.
   */
  @ApiPropertyOptional({
    description: 'Unidad clínica asociada',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /**
   * Identificador asociado a healthcare service.
   */
  @ApiPropertyOptional({
    description: 'Servicio de salud asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  /**
   * Identificador asociado a service line concept.
   */
  @ApiPropertyOptional({
    description: 'Línea de servicio (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceLineConceptId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    description: 'Especialidad (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Identificador asociado a acuity level concept.
   */
  @ApiPropertyOptional({
    description: 'Nivel de agudeza (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  acuityLevelConceptId?: string;

  /**
   * Valor de referral required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere referencia/derivación' })
  @IsOptional()
  @IsBoolean()
  referralRequired?: boolean;
}
