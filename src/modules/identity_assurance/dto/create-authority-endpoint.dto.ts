import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /identity/authorities/{id}/endpoints` (UC-27-01). */
export class CreateAuthorityEndpointDto {
  /**
   * Identificador asociado a integration endpoint.
   */
  @ApiProperty({
    description: 'Endpoint de integración subyacente',
    format: 'uuid',
  })
  @IsUUID()
  integrationEndpointId!: string;

  /**
   * Identificador asociado a capability concept.
   */
  @ApiProperty({
    description: 'Concepto: capacidad del endpoint',
    format: 'uuid',
  })
  @IsUUID()
  capabilityConceptId!: string;

  /**
   * Identificador asociado a assurance level concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: nivel de aseguramiento del endpoint',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assuranceLevelConceptId?: string;

  /**
   * Valor de request contract version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión del contrato de request',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  requestContractVersion?: string;

  /**
   * Valor de response contract version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión del contrato de response',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  responseContractVersion?: string;
}
