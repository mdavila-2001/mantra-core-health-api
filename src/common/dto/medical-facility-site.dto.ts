import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { OpeningHoursField, OpeningHoursShiftDto } from './opening-hours.dto';

/** Recorta los blancos de los extremos; lo que no es texto pasa tal cual. */
export const trimmed = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Recorta cada línea de una lista de textos; lo que no es lista pasa tal cual. */
export const trimmedLines = ({ value }: TransformFnParams): unknown =>
  Array.isArray(value)
    ? value.map((line: unknown) =>
        typeof line === 'string' ? line.trim() : line,
      )
    : value;

/**
 * Una sede declarada del establecimiento: la casa central o una sucursal.
 *
 * Son datos declarados, no la práctica ni la sede operativa: esas se crean en
 * `medical-center-setup` cuando la plataforma verifica la organización, y estos
 * datos sirven para pre-llenarlo y para el equipo de verificación.
 *
 * ## Coordenadas: ambas o ninguna
 *
 * Mismo patrón que `OwnSiteAddressDto`: el `ValidateIf` mira las dos
 * propiedades y no lleva `@IsOptional()` (anularía la condición), así que
 * mandar una sola hace caer a la que falta en su validador y la petición
 * termina en 400. Media coordenada no ubica nada.
 */
export class MedicalFacilitySiteDto {
  /** Nombre de la sede, tal como la va a ver el equipo de verificación. */
  @ApiProperty({ maxLength: 200, example: 'Sucursal Equipetrol' })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /** Líneas de la dirección (calle, número, referencia): de 1 a 10. */
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 10,
    example: ['Av. San Martín 123'],
  })
  @Transform(trimmedLines)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  addressLines!: string[];

  /** Latitud del punto en el mapa; va junto con `longitude` o no va. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90, example: -17.78 })
  @ValidateIf(
    (dto: MedicalFacilitySiteDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLatitude()
  latitude?: number;

  /** Longitud del punto en el mapa; va junto con `latitude` o no va. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180, example: -63.18 })
  @ValidateIf(
    (dto: MedicalFacilitySiteDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsLongitude()
  longitude?: number;

  /** Horario de atención de la sucursal: hasta dos turnos por día. */
  @OpeningHoursField()
  openingHours?: OpeningHoursShiftDto[];
}
