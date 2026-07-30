import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /practices/{practiceId}/sites` (UC-14-01). */
export class CreateSiteDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de sitio único dentro de la práctica',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del sitio', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a site type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de sitio',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteTypeConceptId?: string;

  /**
   * Identificador asociado a physical type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo físico',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  physicalTypeConceptId?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zona horaria IANA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Identificador asociado a address.
   */
  @ApiPropertyOptional({
    description: 'Dirección (common.addresses)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  /**
   * Identificador asociado a branch.
   */
  @ApiPropertyOptional({
    description: 'Sucursal (directory.branches)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Identificador asociado a managing tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant gestor del sitio (directory.tenants)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  managingTenantId?: string;
}
