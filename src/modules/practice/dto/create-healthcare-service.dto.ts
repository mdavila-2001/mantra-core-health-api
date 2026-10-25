import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/healthcare-services` (UC-14-06). */
export class CreateHealthcareServiceDto {
  /**
   * Identificador asociado a practice site.
   */
  @ApiProperty({ description: 'Sitio donde se presta', format: 'uuid' })
  @IsUUID()
  practiceSiteId!: string;

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
  @ApiProperty({
    description:
      'Procedimiento del nomenclador (`VS_BO_MEDICAL_PROCEDURE`) que se ofrece',
    format: 'uuid',
  })
  @IsUUID()
  serviceConceptId!: string;

  /**
   * Ítem de `billing.service_catalog` de esa práctica que fija el precio de este procedimiento en esta sede.
   */
  @ApiProperty({
    description:
      'Ítem del catálogo de precios de la práctica; su concepto debe ser el mismo `serviceConceptId`',
    format: 'uuid',
  })
  @IsUUID()
  serviceCatalogId!: string;

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
