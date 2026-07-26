import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TECHNICAL_DATA_TYPES, type TechnicalDataType } from './create-field-definition.dto';

/** Un valor importado con su procedencia (UC-09-10). */
export class ImportValueItemDto {
  @ApiProperty({ description: 'Instancia de formulario destino', format: 'uuid' })
  @IsUUID()
  formInstanceId!: string;

  @ApiProperty({ description: 'Campo destino', format: 'uuid' })
  @IsUUID()
  fieldId!: string;

  @ApiProperty({ enum: TECHNICAL_DATA_TYPES, description: 'Tipo de dato (determina value[x])' })
  @IsIn(TECHNICAL_DATA_TYPES as unknown as string[])
  dataType!: TechnicalDataType;

  @ApiProperty({ description: 'Valor importado' })
  @Allow()
  value!: unknown;

  @ApiPropertyOptional({ description: 'URI del sistema origen', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceSystemUri?: string;

  @ApiPropertyOptional({ description: 'Tipo de recurso origen', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceResourceType?: string;

  @ApiPropertyOptional({ description: 'Id de recurso origen', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceResourceId?: string;

  @ApiPropertyOptional({ description: 'Hash de contenido (idempotencia)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentHash?: string;
}

/** Cuerpo de `POST /forms/values/import` (UC-09-10) — lote ETL. */
export class ImportValuesDto {
  @ApiProperty({ description: 'Identificador del lote de importación', format: 'uuid' })
  @IsUUID()
  importBatchId!: string;

  @ApiProperty({ type: [ImportValueItemDto], description: 'Valores a importar' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportValueItemDto)
  items!: ImportValueItemDto[];
}
