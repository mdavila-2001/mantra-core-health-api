import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /identity/authorities/{id}/endpoints` (UC-27-01). */
export class CreateAuthorityEndpointDto {
  @ApiProperty({
    description: 'Endpoint de integración subyacente',
    format: 'uuid',
  })
  @IsUUID()
  integrationEndpointId!: string;

  @ApiProperty({
    description: 'Concepto: capacidad del endpoint',
    format: 'uuid',
  })
  @IsUUID()
  capabilityConceptId!: string;

  @ApiPropertyOptional({
    description: 'Concepto: nivel de aseguramiento del endpoint',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assuranceLevelConceptId?: string;

  @ApiPropertyOptional({
    description: 'Versión del contrato de request',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  requestContractVersion?: string;

  @ApiPropertyOptional({
    description: 'Versión del contrato de response',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  responseContractVersion?: string;
}
