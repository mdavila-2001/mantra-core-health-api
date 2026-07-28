import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /tenants/{tenantId}/child-tenants` (UC-04-03). */
export class CreateChildTenantDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único global del sub-tenant',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Razón social / nombre legal del sub-tenant',
    maxLength: 300,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  /**
   * Identificador asociado a admin user.
   */
  @ApiProperty({
    description: 'Usuario administrador inicial del sub-tenant',
    format: 'uuid',
  })
  @IsUUID()
  adminUserId!: string;

  /**
   * Identificador asociado a tenant type concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del tipo de tenant',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantTypeConceptId?: string;

  /**
   * Identificador asociado a legal entity type concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del tipo de entidad legal',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalEntityTypeConceptId?: string;

  /**
   * Identificador asociado a data residency region concept.
   */
  @ApiPropertyOptional({
    description:
      'Región de residencia de datos (por defecto hereda la del padre)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataResidencyRegionConceptId?: string;
}
