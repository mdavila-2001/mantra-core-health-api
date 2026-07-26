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
  @ApiProperty({ description: 'Ruta origen en el payload' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  sourcePath!: string;

  @ApiProperty({ description: 'Campo destino en el esquema canónico' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  targetField!: string;

  @ApiPropertyOptional({ description: 'Concept map aplicable', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conceptMapId?: string;

  @ApiPropertyOptional({ description: 'Transformación declarativa' })
  @IsOptional()
  @IsObject()
  transformJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Dirección del mapeo', enum: ['INBOUND', 'OUTBOUND'] })
  @IsOptional()
  @IsIn(['INBOUND', 'OUTBOUND'])
  direction?: DirectionCode;
}

/** Cuerpo de `POST /integrations/providers/{id}/endpoints` (UC-12-04). */
export class PublishEndpointDto {
  @ApiProperty({ description: 'Código del endpoint', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Operación lógica que expone', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  operation!: string;

  @ApiProperty({ description: 'Versión del endpoint (única por proveedor)', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  version!: string;

  @ApiPropertyOptional({ description: 'Método HTTP', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] })
  @IsOptional()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  httpMethod?: HttpMethodCode;

  @ApiPropertyOptional({ description: 'Ruta relativa del endpoint' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  path?: string;

  @ApiPropertyOptional({ description: 'Esquema JSON de la petición' })
  @IsOptional()
  @IsObject()
  requestSchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Esquema JSON de la respuesta' })
  @IsOptional()
  @IsObject()
  responseSchemaJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Timeout en milisegundos', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMs?: number;

  @ApiPropertyOptional({ description: 'Mapeos de campos publicados en la misma transacción', type: [FieldMappingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMappingDto)
  mappings?: FieldMappingDto[];
}
