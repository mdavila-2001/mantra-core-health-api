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
import {
  TECHNICAL_DATA_TYPES,
  type TechnicalDataType,
} from './create-field-definition.dto';

/** Un valor importado con su procedencia (UC-09-10). */
export class ImportValueItemDto {
  /**
   * Identificador asociado a form instance.
   */
  @ApiProperty({
    description: 'Instancia de formulario destino',
    format: 'uuid',
  })
  @IsUUID()
  formInstanceId!: string;

  /**
   * Identificador asociado a field.
   */
  @ApiProperty({ description: 'Campo destino', format: 'uuid' })
  @IsUUID()
  fieldId!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty({
    enum: TECHNICAL_DATA_TYPES,
    description: 'Tipo de dato (determina value[x])',
  })
  @IsIn(TECHNICAL_DATA_TYPES)
  dataType!: TechnicalDataType;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor importado' })
  @Allow()
  value!: unknown;

  /**
   * Valor de source system uri mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'URI del sistema origen',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceSystemUri?: string;

  /**
   * Valor de source resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de recurso origen',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceResourceType?: string;

  /**
   * Identificador asociado a source resource.
   */
  @ApiPropertyOptional({ description: 'Id de recurso origen', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceResourceId?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash de contenido (idempotencia)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentHash?: string;
}

/** Cuerpo de `POST /forms/values/import` (UC-09-10) — lote ETL. */
export class ImportValuesDto {
  /**
   * Identificador asociado a import batch.
   */
  @ApiProperty({
    description: 'Identificador del lote de importación',
    format: 'uuid',
  })
  @IsUUID()
  importBatchId!: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [ImportValueItemDto],
    description: 'Valores a importar',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportValueItemDto)
  items!: ImportValueItemDto[];
}
