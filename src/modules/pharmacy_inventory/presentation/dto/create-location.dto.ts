import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsStrictBoolean } from '../../../pharmacy/dto/strict-boolean';

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
  @IsStrictBoolean()
  controlledAccess?: boolean;

  /** F5c: espacio físico donde vive la ubicación (perfil `stockPoint`, misma sede). */
  @ApiPropertyOptional({ format: 'uuid', description: 'Espacio físico (F5c)' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /** F5c: unidad clínica dueña (obligatoria para `WARD_STOCK`). */
  @ApiPropertyOptional({ format: 'uuid', description: 'Unidad clínica (F5c)' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /** F5c: tipo de ubicación; por defecto `SHELF`. */
  @ApiPropertyOptional({ enum: ['SHELF', 'WARD_STOCK'], default: 'SHELF' })
  @IsOptional()
  @IsIn(['SHELF', 'WARD_STOCK'])
  locationTypeCode?: 'SHELF' | 'WARD_STOCK';
}

/** Cuerpo de `POST /pharmacy/inventory-locations/:id/relocate` (F5c). */
export class RelocateLocationDto {
  /** Espacio destino (perfil `stockPoint`, misma sede). */
  @ApiProperty({ format: 'uuid', description: 'Espacio destino' })
  @IsUUID()
  careSpaceId!: string;
}
