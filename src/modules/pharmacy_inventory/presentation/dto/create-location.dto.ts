import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /pharmacy/:siteId/inventory-locations` (bootstrap de ubicación). */
export class CreateLocationDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de la ubicación' })
  @IsString()
  @MaxLength(64)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre legible de la ubicación' })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a parent location.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ubicación padre (jerarquía)',
  })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  /**
   * Valor de controlled access mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere acceso controlado' })
  @IsOptional()
  @IsBoolean()
  controlledAccess?: boolean;

  /**
   * Espacio donde queda la ubicación (F5c). Se elige del árbol de la sede, nunca a mano.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Espacio de la ubicación: del tenant, de la misma sede que la farmacia y con perfil de punto de stock',
  })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /**
   * Unidad dueña de la ubicación (F5c): obligatoria para el botiquín de piso.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Unidad clínica dueña (un botiquín vigente por unidad)',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /**
   * Tipo de ubicación (F5c). Sin él se crea un estante, como siempre.
   */
  @ApiPropertyOptional({
    enum: ['SHELF', 'WARD_STOCK'],
    description: 'Tipo de ubicación; `WARD_STOCK` es el botiquín de una unidad',
  })
  @IsOptional()
  @IsIn(['SHELF', 'WARD_STOCK'])
  locationTypeCode?: 'SHELF' | 'WARD_STOCK';
}
