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
  @ApiProperty({
    description: 'Código de sitio único dentro de la práctica',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre del sitio', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Concepto de tipo de sitio',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concepto de tipo físico',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  physicalTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Zona horaria IANA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({
    description: 'Dirección (common.addresses)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional({
    description: 'Sucursal (directory.branches)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Tenant gestor del sitio (directory.tenants)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  managingTenantId?: string;
}
