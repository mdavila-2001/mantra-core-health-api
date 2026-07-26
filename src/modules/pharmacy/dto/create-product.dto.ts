import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Tipo de identificador', enum: ['GTIN', 'NDC'] })
  @IsIn(['GTIN', 'NDC'])
  identifierType!: IdentifierTypeCode;

  @ApiProperty({ description: 'Valor del identificador', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  identifierValue!: string;

  @ApiPropertyOptional({ description: 'Tenant de la autoridad que asigna el identificador', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assigningAuthorityTenantId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;
}

/** Cuerpo de `POST /pharmacies/{pharmacyId}/products` (UC-24-04). */
export class CreateProductDto {
  @ApiProperty({ description: 'Código único de producto por farmacia', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  productCode!: string;

  @ApiPropertyOptional({ description: 'Concept id del medicamento', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  medicationConceptId?: string;

  @ApiPropertyOptional({ description: 'Tenant fabricante', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  manufacturerTenantId?: string;

  @ApiPropertyOptional({ description: 'Marca comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  brandName?: string;

  @ApiPropertyOptional({ description: 'Nombre genérico', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  genericName?: string;

  @ApiPropertyOptional({ description: 'Concentración (texto libre)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  strengthText?: string;

  @ApiPropertyOptional({ description: 'Concept id de la forma farmacéutica', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dosageFormConceptId?: string;

  @ApiPropertyOptional({ description: 'Tamaño de empaque (texto libre)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageSizeText?: string;

  @ApiPropertyOptional({ description: 'Requiere receta' })
  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @ApiPropertyOptional({ description: 'Requiere cadena de frío' })
  @IsOptional()
  @IsBoolean()
  coldChainRequired?: boolean;

  @ApiPropertyOptional({ description: 'Identificadores (GTIN/NDC)', type: [ProductIdentifierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIdentifierDto)
  identifiers?: ProductIdentifierDto[];
}
