import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Dirección de una sede propia, tal como la manda `POST /practitioners/me/sites`.
 *
 * Es un subconjunto de `CreateAddressDto` (`common/dto/addresses.dto.ts`):
 * `ownerType`/`ownerId` los resuelve el servicio desde el actor, no el
 * cliente, y `country` no se ofrece porque el único sembrado es Bolivia.
 */
export class OwnSiteAddressDto {
  /** Líneas de la dirección (calle, número, referencia). */
  @ApiProperty({ type: [String], description: 'Líneas de la dirección' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  lines!: string[];

  /** Ciudad, en texto libre. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  /** Municipio boliviano, miembro de `VS_BO_MUNICIPALITY`. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  municipalityConceptId?: string;

  /** Departamento boliviano, miembro de `VS_BO_DEPARTMENT`. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  administrativeAreaConceptId?: string;

  /**
   * Latitud del punto elegido en el mapa.
   *
   * Sin ella, la sede sigue sirviendo por texto (calle, ciudad); con ella, el
   * perfil público y la reserva pueden dibujar el punto en Leaflet.
   */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  /** Longitud del punto. Va siempre junto a `latitude`. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

/**
 * Cuerpo de `POST /practitioners/me/sites` (ALV-005/006).
 *
 * Da de alta un consultorio propio del profesional autenticado: crea (o
 * reutiliza) su práctica personal, la sede y la asignación de rol que la
 * vincula, todo en una transacción. No exige `organizationId` ni
 * `practiceId`: es exactamente el caso que el alta de profesional dejaba sin
 * resolver — "atiendo en mi propio consultorio, sin estar afiliado a nadie".
 */
export class CreateOwnSiteDto {
  /** Nombre del consultorio, tal como lo va a ver el paciente. */
  @ApiProperty({ description: 'Nombre del consultorio', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  /** Zona horaria IANA de la sede. Por defecto la de La Paz. */
  @ApiPropertyOptional({ example: 'America/La_Paz' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /** Dirección de la sede. Opcional: se puede cargar más tarde. */
  @ApiPropertyOptional({ type: OwnSiteAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OwnSiteAddressDto)
  address?: OwnSiteAddressDto;
}
