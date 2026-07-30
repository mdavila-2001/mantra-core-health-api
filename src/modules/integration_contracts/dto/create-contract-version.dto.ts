import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/versions` (UC-31-02). */
export class CreateContractVersionDto {
  /**
   * Identificador asociado a request schema file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de esquema de request',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestSchemaFileId?: string;

  /**
   * Identificador asociado a response schema file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de esquema de response',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  responseSchemaFileId?: string;

  /**
   * Identificador asociado a openapi file.
   */
  @ApiPropertyOptional({ description: 'Archivo OpenAPI', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  openapiFileId?: string;

  /**
   * Identificador asociado a mapping profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil de mapeo asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  mappingProfileId?: string;

  /**
   * Valor de contract hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del contrato para detectar drift de esquema',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contractHash?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio de vigencia (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;
}
