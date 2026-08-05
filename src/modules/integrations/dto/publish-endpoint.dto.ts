import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { DirectionCode, HttpMethodCode } from '../integrations.concepts';

/** Una fila de mapeo de campos de un endpoint (UC-12-04). */
export class FieldMappingDto {
  /**
   * Valor de source path mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ruta origen en el payload' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  sourcePath!: string;

  /**
   * Valor de target field mantenido por la instancia.
   */
  @ApiProperty({ description: 'Campo destino en el esquema canónico' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  targetField!: string;

  /**
   * Identificador asociado a concept map.
   */
  @ApiPropertyOptional({ description: 'Concept map aplicable', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conceptMapId?: string;

  /**
   * Valor de transform json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Transformación declarativa' })
  @IsOptional()
  @IsObject()
  transformJson?: Record<string, unknown>;

  /**
   * Valor de direction mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Dirección del mapeo',
    enum: ['INBOUND', 'OUTBOUND'],
  })
  @IsOptional()
  @IsIn(['INBOUND', 'OUTBOUND'])
  direction?: DirectionCode;
}

/** Cuerpo de `POST /integrations/providers/{id}/endpoints` (UC-12-04). */
export class PublishEndpointDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del endpoint', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de operation mantenido por la instancia.
   */
  @ApiProperty({ description: 'Operación lógica que expone', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  operation!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Versión del endpoint (única por proveedor)',
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  version!: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Método HTTP',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  @IsOptional()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  httpMethod?: HttpMethodCode;

  /**
   * Valor de path mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Ruta relativa del endpoint' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  path?: string;

  /**
   * Valor de request schema json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Esquema JSON de la petición' })
  @IsOptional()
  @IsObject()
  requestSchemaJson?: Record<string, unknown>;

  /**
   * Valor de response schema json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Esquema JSON de la respuesta' })
  @IsOptional()
  @IsObject()
  responseSchemaJson?: Record<string, unknown>;

  /**
   * Valor de timeout ms mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Timeout en milisegundos', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMs?: number;

  /**
   * Valor de mappings mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Mapeos de campos publicados en la misma transacción',
    type: [FieldMappingDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  mappings?: FieldMappingDto[];
}
