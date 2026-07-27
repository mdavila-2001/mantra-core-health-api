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
  @ApiPropertyOptional({
    description: 'Archivo de esquema de request',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestSchemaFileId?: string;

  @ApiPropertyOptional({
    description: 'Archivo de esquema de response',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  responseSchemaFileId?: string;

  @ApiPropertyOptional({ description: 'Archivo OpenAPI', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  openapiFileId?: string;

  @ApiPropertyOptional({
    description: 'Perfil de mapeo asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  mappingProfileId?: string;

  @ApiPropertyOptional({
    description: 'Hash del contrato para detectar drift de esquema',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contractHash?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;
}
