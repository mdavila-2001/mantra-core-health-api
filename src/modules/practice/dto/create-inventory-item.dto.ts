import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/inventory-items` (UC-14-10). */
export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Nombre del insumo', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Concepto de producto', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productConceptId?: string;

  @ApiPropertyOptional({ description: 'Número de lote', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Fecha de caducidad (ISO date)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Concepto de unidad de medida',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  @ApiPropertyOptional({ description: 'Nivel de reorden (numérico)' })
  @IsOptional()
  @IsNumberString()
  reorderLevel?: string;
}
