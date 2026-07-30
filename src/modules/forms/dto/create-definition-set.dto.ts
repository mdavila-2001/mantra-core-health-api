import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /forms/definition-sets` (UC-09-01). */
export class CreateDefinitionSetDto {
  /**
   * Valor de namespace uri mantenido por la instancia.
   */
  @ApiProperty({
    description: 'URI de namespace único del set',
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  namespaceUri!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código estable del set', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre legible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a owner tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerTenantId?: string;

  /**
   * Identificador asociado a target domain concept.
   */
  @ApiPropertyOptional({
    description: 'Dominio destino (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetDomainConceptId?: string;

  /**
   * Valor de semantic version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión semántica inicial',
    default: '1.0.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  semanticVersion?: string;
}
