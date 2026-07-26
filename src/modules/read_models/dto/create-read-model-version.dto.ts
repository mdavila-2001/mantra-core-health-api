import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ReadModelDependencyInputDto } from './create-read-model-definition.dto';

/**
 * Cuerpo de `POST /read-models/definitions/{schema}/{object}/versions` (UC-30-08).
 * El schema/object viajan en la ruta; aquí solo cambia el contenido de la nueva
 * versión (tipo de objeto, metadatos y dependencias). La versión anterior queda
 * ACTIVE para rollback hasta el corte.
 */
export class CreateReadModelVersionDto {
  @ApiProperty({ description: 'Tipo de objeto físico', enum: ['VIEW', 'MATERIALIZED_VIEW'] })
  @IsIn(['VIEW', 'MATERIALIZED_VIEW'])
  objectType!: 'VIEW' | 'MATERIALIZED_VIEW';

  @ApiPropertyOptional({ description: 'Modo de refresh', enum: ['CONCURRENT', 'SCHEDULED'] })
  @IsOptional()
  @IsIn(['CONCURRENT', 'SCHEDULED'])
  refreshMode?: 'CONCURRENT' | 'SCHEDULED';

  @ApiPropertyOptional({ description: 'Máxima antigüedad tolerada en segundos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximumStalenessSeconds?: number;

  @ApiPropertyOptional({ description: 'Propósito legible del read model' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  purposeText?: string;

  @ApiPropertyOptional({ description: 'La vista contiene PII' })
  @IsOptional()
  @IsBoolean()
  containsPii?: boolean;

  @ApiPropertyOptional({ description: 'La vista contiene PHI' })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  @ApiProperty({ description: 'Dependencias upstream de la nueva versión', type: [ReadModelDependencyInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReadModelDependencyInputDto)
  dependencies!: ReadModelDependencyInputDto[];
}
