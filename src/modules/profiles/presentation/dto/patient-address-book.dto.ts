import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/** Tope del nombre que la persona le pone a una dirección («Casa de mi mamá»). */
export const ADDRESS_LABEL_MAX_LENGTH = 60;

/** Tope de la calle; el mismo que el domicilio del alta y del perfil. */
export const ADDRESS_LINES_MAX_LENGTH = 300;

/** Tope del distrito o zona: un nombre, no una dirección. */
export const DISTRICT_MAX_LENGTH = 200;

/** Qué es cada dirección de la libreta. */
export const ADDRESS_BOOK_KINDS = ['HOME', 'WORK', 'SAVED'] as const;
export type AddressBookKind = (typeof ADDRESS_BOOK_KINDS)[number];

/**
 * Una dirección de la libreta del paciente.
 *
 * `HOME` es el domicilio del alta y de la ficha, `WORK` el del trabajo, y
 * `SAVED` las que la persona guardó para envíos. La preferida es la que se
 * ofrece primero; si no marcó ninguna, es el domicilio.
 */
export class PatientAddressDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ADDRESS_BOOK_KINDS })
  kind!: AddressBookKind;

  @ApiProperty({
    description:
      'Nombre para mostrar: el que puso la persona, o «Casa» / «Trabajo» para domicilio y trabajo.',
  })
  label!: string;

  @ApiPropertyOptional({ description: 'Calle, número y referencia' })
  lines?: string;

  @ApiPropertyOptional({ description: 'Ciudad, derivada del municipio' })
  city?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio (VS_BO_MUNICIPALITY)',
  })
  municipalityConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Provincia o condado (VS_ADMIN_DIVISION, nivel 2), deducida del municipio',
  })
  administrativeArea2ConceptId?: string;

  @ApiPropertyOptional({
    description: 'Distrito o zona, tal como lo dio el mapa',
  })
  district?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Viaja siempre junto a la latitud' })
  longitude?: number;

  @ApiProperty({ description: 'Si es la que se ofrece primero' })
  isPreferred!: boolean;
}

/** Latitud y longitud: las dos o ninguna, como en el alta. */
const conPunto = (dto: { latitude?: number; longitude?: number }) =>
  dto.latitude !== undefined || dto.longitude !== undefined;

/** Guardar una dirección nueva en la libreta. */
export class CreatePatientAddressDto {
  @ApiProperty({
    maxLength: ADDRESS_LABEL_MAX_LENGTH,
    example: 'Casa de mi mamá',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(ADDRESS_LABEL_MAX_LENGTH)
  label!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Municipio (VS_BO_MUNICIPALITY)',
  })
  @IsUUID()
  municipalityConceptId!: string;

  @ApiPropertyOptional({ maxLength: ADDRESS_LINES_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_LINES_MAX_LENGTH)
  lines?: string;

  /** Distrito o zona, tal como lo da el mapa (ADR-0028). */
  @ApiPropertyOptional({ maxLength: DISTRICT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(DISTRICT_MAX_LENGTH)
  district?: string;

  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(conPunto)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(conPunto)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Marcarla como la que se ofrece primero',
  })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;
}

/**
 * Corregir una dirección de la libreta. Lo que no viene, no cambia.
 *
 * Corregir **cierra la vigente y abre otra** (`valid_to`), como el domicilio
 * del perfil: el envío que ya salió a la dirección vieja sigue apuntando a ella.
 */
export class UpdatePatientAddressDto {
  @ApiPropertyOptional({
    maxLength: ADDRESS_LABEL_MAX_LENGTH,
    description:
      'Sólo para las guardadas: domicilio y trabajo tienen nombre fijo.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(ADDRESS_LABEL_MAX_LENGTH)
  label?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  municipalityConceptId?: string;

  @ApiPropertyOptional({
    maxLength: ADDRESS_LINES_MAX_LENGTH,
    description: 'Vacío para quitarla',
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_LINES_MAX_LENGTH)
  lines?: string;

  /** Distrito o zona. Vacío para quitarlo; ausente lo conserva. */
  @ApiPropertyOptional({
    maxLength: DISTRICT_MAX_LENGTH,
    description: 'Vacío para quitarlo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(DISTRICT_MAX_LENGTH)
  district?: string;

  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(conPunto)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(conPunto)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
