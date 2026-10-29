import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `PATCH /practices/{practiceId}/healthcare-services/{id}`. */
export class UpdateHealthcareServiceDto {
  /**
   * Ítem de catálogo que fija el precio del procedimiento en la sede.
   */
  @ApiPropertyOptional({
    description:
      'Nuevo ítem del catálogo de precios de la práctica; su concepto debe coincidir con el del servicio',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  serviceCatalogId?: string;

  /**
   * Si la sede ofrece el procedimiento. Desactivarlo lo saca de la búsqueda.
   */
  @ApiPropertyOptional({ description: '¿El procedimiento está activo?' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
