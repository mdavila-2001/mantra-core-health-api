import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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
}
