import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ContactUse, OwnerType } from './enums';

/** Cuerpo de `POST /common/addresses`. */
export class CreateAddressDto {
  /**
   * Valor de owner type mantenido por la instancia.
   */
  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  /**
   * Identificador asociado a owner.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Líneas de la dirección.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  lines!: string[];

  /**
   * Valor de city mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  /**
   * Municipio boliviano, miembro de `VS_BO_MUNICIPALITY` (catálogo del INE).
   * Complementa `city` (texto libre) con un valor de catálogo consistente.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  municipalityConceptId?: string;

  /**
   * Departamento boliviano, miembro de `VS_BO_DEPARTMENT`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  administrativeAreaConceptId?: string;

  /**
   * Valor de postal code mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  /**
   * Valor de country mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: "Código de país ISO. Por defecto 'BO'." })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  /**
   * Valor de use mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ContactUse })
  @IsOptional()
  @IsEnum(ContactUse)
  use?: ContactUse;
}

/** Representación segura de una dirección. */
export class AddressResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a owner.
   */
  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  /**
   * Valor de owner type mantenido por la instancia.
   */
  @ApiProperty({ enum: OwnerType })
  ownerType!: OwnerType;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({ type: [String] })
  lines!: string[];

  /**
   * Valor de city mantenido por la instancia.
   */
  @ApiPropertyOptional()
  city?: string;

  /**
   * Municipio boliviano, miembro de `VS_BO_MUNICIPALITY`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  municipalityConceptId?: string;

  /**
   * Departamento boliviano, miembro de `VS_BO_DEPARTMENT`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  administrativeAreaConceptId?: string;

  /**
   * Valor de postal code mantenido por la instancia.
   */
  @ApiPropertyOptional()
  postalCode?: string;

  /**
   * Valor de country mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de país.' })
  country!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
