import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /admin/tenants` (UC-04-01: aprovisionar tenant raíz). */
export class CreateTenantDto {
  @ApiProperty({
    description: 'Código único global del tenant',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Razón social / nombre legal', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  @ApiProperty({
    description: 'Usuario que será owner inicial del tenant',
    format: 'uuid',
  })
  @IsUUID()
  ownerUserId!: string;

  @ApiPropertyOptional({ description: 'Nombre comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string;

  @ApiPropertyOptional({
    description: 'Concept id del tipo de tenant',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concept id del tipo de entidad legal',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalEntityTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concept id de la región de residencia de datos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataResidencyRegionConceptId?: string;

  @ApiPropertyOptional({ description: 'Zona horaria IANA', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}
