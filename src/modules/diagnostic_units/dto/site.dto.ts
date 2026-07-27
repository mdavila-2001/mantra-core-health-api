import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /diagnostic-units/{id}/sites` (UC-23-02). */
export class AddSiteDto {
  @ApiProperty({
    description: 'Sitio del practice donde opera la unidad',
    format: 'uuid',
  })
  @IsUUID()
  practiceSiteId!: string;

  @ApiPropertyOptional({
    description: 'Rol del sitio (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Prefijo de accesión', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accessionPrefix?: string;

  @ApiPropertyOptional({ description: 'Toma de muestras disponible' })
  @IsOptional()
  @IsBoolean()
  sampleCollectionAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Imagenología disponible' })
  @IsOptional()
  @IsBoolean()
  imagingAvailable?: boolean;
}

/** Cuerpo de `PATCH /diagnostic-unit-sites/{siteId}` (UC-23-02). */
export class UpdateSiteDto {
  @ApiPropertyOptional({
    description: 'Rol del sitio (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Prefijo de accesión', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accessionPrefix?: string;

  @ApiPropertyOptional({ description: 'Toma de muestras disponible' })
  @IsOptional()
  @IsBoolean()
  sampleCollectionAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Imagenología disponible' })
  @IsOptional()
  @IsBoolean()
  imagingAvailable?: boolean;
}
