import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
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

  /**
   * Latitud del punto, si se conoce.
   *
   * Sin ella la dirección sigue sirviendo por texto (ciudad, calle); con
   * ella, la ficha pública puede dibujar el punto en un mapa en vez de sólo
   * nombrarlo.
   */
  @ApiPropertyOptional({
    description: 'Latitud geográfica',
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  /** Longitud del punto, si se conoce. Va siempre junto a `latitude`. */
  @ApiPropertyOptional({
    description: 'Longitud geográfica',
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
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

  /** Latitud del punto, si se cargó. */
  @ApiPropertyOptional()
  latitude?: number;

  /** Longitud del punto, si se cargó. */
  @ApiPropertyOptional()
  longitude?: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
