import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/healthcare-services` (UC-14-06). */
export class CreateHealthcareServiceDto {
  /**
   * Identificador asociado a practice site.
   */
  @ApiPropertyOptional({ description: 'Sitio donde se presta', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Identificador asociado a clinical unit.
   */
  @ApiPropertyOptional({
    description: 'Unidad clínica que lo presta',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ description: 'Concepto de servicio', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de especialidad',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  /**
   * Valor de referral required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Requiere derivación?' })
  @IsOptional()
  @IsBoolean()
  referralRequired?: boolean;

  /**
   * Valor de appointment required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Requiere cita?' })
  @IsOptional()
  @IsBoolean()
  appointmentRequired?: boolean;

  /**
   * Valor de telehealth available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: '¿Disponible por telesalud?' })
  @IsOptional()
  @IsBoolean()
  telehealthAvailable?: boolean;
}
