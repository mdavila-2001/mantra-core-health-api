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
  /**
   * Identificador asociado a practice site.
   */
  @ApiProperty({
    description: 'Sitio del practice donde opera la unidad',
    format: 'uuid',
  })
  @IsUUID()
  practiceSiteId!: string;

  /**
   * Identificador asociado a site role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol del sitio (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteRoleConceptId?: string;

  /**
   * Valor de accession prefix mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Prefijo de accesión', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accessionPrefix?: string;

  /**
   * Valor de sample collection available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Toma de muestras disponible' })
  @IsOptional()
  @IsBoolean()
  sampleCollectionAvailable?: boolean;

  /**
   * Valor de imaging available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Imagenología disponible' })
  @IsOptional()
  @IsBoolean()
  imagingAvailable?: boolean;
}

/** Cuerpo de `PATCH /diagnostic-unit-sites/{siteId}` (UC-23-02). */
export class UpdateSiteDto {
  /**
   * Identificador asociado a site role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol del sitio (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteRoleConceptId?: string;

  /**
   * Valor de accession prefix mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Prefijo de accesión', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accessionPrefix?: string;

  /**
   * Valor de sample collection available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Toma de muestras disponible' })
  @IsOptional()
  @IsBoolean()
  sampleCollectionAvailable?: boolean;

  /**
   * Valor de imaging available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Imagenología disponible' })
  @IsOptional()
  @IsBoolean()
  imagingAvailable?: boolean;
}
