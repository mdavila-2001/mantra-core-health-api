import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Tipos de identificador soportados. */
export type IdentifierTypeCode = 'GTIN' | 'NDC';

/** Identificador de producto (GTIN/NDC) que acompaña la publicación (UC-24-04). */
export class ProductIdentifierDto {
  /**
   * Valor de identifier type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de identificador', enum: ['GTIN', 'NDC'] })
  @IsIn(['GTIN', 'NDC'])
  identifierType!: IdentifierTypeCode;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor del identificador', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  identifierValue!: string;

  /**
   * Identificador asociado a assigning authority tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant de la autoridad que asigna el identificador',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assigningAuthorityTenantId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /pharmacies/{pharmacyId}/products` (UC-24-04). */
@ApiSchema({ name: 'PharmacyCreateProductDto' })
export class CreateProductDto {
  /**
   * Valor de product code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de producto por farmacia',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  productCode!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del medicamento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string;

  /**
   * Identificador asociado a manufacturer tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant fabricante', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  manufacturerTenantId?: string;

  /**
   * Valor de brand name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marca comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  brandName?: string;

  /**
   * Valor de generic name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre genérico', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  genericName?: string;

  /**
   * Valor de strength text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Concentración (texto libre)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  strengthText?: string;

  /**
   * Identificador asociado a dosage form concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la forma farmacéutica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dosageFormConceptId?: string;

  /**
   * Valor de package size text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tamaño de empaque (texto libre)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageSizeText?: string;

  /**
   * Valor de requires prescription mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere receta' })
  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  /**
   * Valor de cold chain required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere cadena de frío' })
  @IsOptional()
  @IsBoolean()
  coldChainRequired?: boolean;

  /**
   * Valor de identifiers mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Identificadores (GTIN/NDC)',
    type: [ProductIdentifierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIdentifierDto)
  identifiers?: ProductIdentifierDto[];
}
