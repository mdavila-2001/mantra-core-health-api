import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Cuerpo de `POST /forms/definition-sets` (UC-09-01). */
export class CreateDefinitionSetDto {
  @ApiProperty({ description: 'URI de namespace único del set', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  namespaceUri!: string;

  @ApiProperty({ description: 'Código estable del set', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre legible', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerTenantId?: string;

  @ApiPropertyOptional({ description: 'Dominio destino (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetDomainConceptId?: string;

  @ApiPropertyOptional({ description: 'Versión semántica inicial', default: '1.0.0' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  semanticVersion?: string;
}
