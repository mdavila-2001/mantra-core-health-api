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
  @ApiProperty({ description: 'Código de la ubicación' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ description: 'Nombre legible de la ubicación' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ubicación padre (jerarquía)',
  })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @ApiPropertyOptional({ description: 'Requiere acceso controlado' })
  @IsOptional()
  @IsBoolean()
  controlledAccess?: boolean;
}
