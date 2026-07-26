import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /integrations/messages:outbound` (UC-12-05). */
export class EnqueueOutboundDto {
  @ApiProperty({ description: 'Conexión (ACTIVE) por la que se enviará', format: 'uuid' })
  @IsUUID()
  connectionId!: string;

  @ApiPropertyOptional({ description: 'Endpoint de integración a invocar', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  endpointId?: string;

  @ApiProperty({ description: 'Clave de idempotencia provista por el productor', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  idempotencyKey!: string;

  @ApiPropertyOptional({ description: 'Correlación (por defecto la idempotency_key)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  correlationId?: string;

  @ApiProperty({ description: 'Payload de la petición saliente' })
  @IsObject()
  requestPayloadJson!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Cabeceras a enviar' })
  @IsOptional()
  @IsObject()
  headersJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Tipo de recurso de negocio origen (polimórfico)', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceResourceType?: string;

  @ApiPropertyOptional({ description: 'Id del recurso de negocio origen', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceResourceId?: string;
}
