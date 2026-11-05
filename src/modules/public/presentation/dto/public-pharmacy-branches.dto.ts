import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  PRESCRIPTION_ITEM_MAX_LENGTH,
  PRESCRIPTION_MAX_ITEMS,
} from '../../domain/public-pharmacy-branches.domain';

/**
 * Cuerpo de `POST /public/profiles/f/:slug/branch-availability` (P37).
 *
 * Es una lectura y aun así va por `POST`: un renglón de receta es un dato de
 * salud, y la URL queda en el historial del navegador, en los proxies y en el
 * log de acceso de cada salto (el cuerpo no se registra). Sin sesión, sin id de
 * paciente: no se guarda nada.
 */
export class PublicPrescriptionAvailabilityDto {
  /** Los renglones tal como están en la receta, uno por elemento. */
  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: PRESCRIPTION_MAX_ITEMS,
    example: ['Paracetamol 500 mg', 'Losartán'],
    description:
      'Texto libre: una receta de papel no trae ids de producto. Vacíos y repetidos (sin tildes) se ignoran.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(PRESCRIPTION_MAX_ITEMS)
  @IsString({ each: true })
  @MaxLength(PRESCRIPTION_ITEM_MAX_LENGTH, { each: true })
  items!: string[];

  /** Latitud de quien busca; con `lng`, habilita la distancia en línea recta. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90, example: -17.78 })
  @ValidateIf((dto: PublicPrescriptionAvailabilityDto) => dto.lng !== undefined)
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  lat?: number;

  /** Longitud de quien busca; viaja junto con `lat` o no viaja. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180, example: -63.18 })
  @ValidateIf((dto: PublicPrescriptionAvailabilityDto) => dto.lat !== undefined)
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  lng?: number;
}

/** Un punto en grados decimales. */
export class PublicGeoPointDto {
  @ApiProperty({ example: -17.78 })
  lat!: number;

  @ApiProperty({ example: -63.18 })
  lng!: number;
}

/** Una sucursal de la farmacia, como se lee desde afuera. */
export class PublicPharmacyBranchDto {
  /** La sede (`pharmacy.pharmacy_sites`): la clave de la sucursal. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** El slug de la ficha pública; todas las sedes de un tenant lo comparten. */
  @ApiProperty()
  slug!: string;

  /** «Farmacorp · San Miguel». */
  @ApiProperty()
  name!: string;

  /** Sólo la sucursal («San Miguel»). */
  @ApiProperty()
  siteName!: string;

  @ApiProperty({ type: String, nullable: true })
  city!: string | null;

  @ApiProperty({ type: String, nullable: true })
  addressText!: string | null;

  /** Siempre `null` por ahora: la sede no tiene teléfono en el modelo. */
  @ApiProperty({ type: String, nullable: true })
  phone!: string | null;

  /** Siempre `null` por ahora: no hay horario estructurado; ver `description`. */
  @ApiProperty({ type: String, nullable: true })
  openingHours!: string | null;

  /** Lo que la cadena escribió de esa sucursal (horario, piso…), P54. */
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  /** Enlace de mapa `http(s)` que pegó la cadena, P54. */
  @ApiProperty({ type: String, nullable: true })
  locationUrl!: string | null;

  /** Sin punto no hay pin ni distancia. */
  @ApiProperty({ type: PublicGeoPointDto, nullable: true })
  location!: PublicGeoPointDto | null;

  /** Siempre `null` por ahora: el modelo no guarda la precisión del punto. */
  @ApiProperty({ type: String, nullable: true })
  locationAccuracy!: string | null;

  /** `true` sólo si la cadena tiene una única sucursal: es la de la ficha. */
  @ApiProperty()
  isCurrent!: boolean;
}

/** Página pública de sucursales (envoltura de `CONTRATO-PUBLICO.md`). */
export class PublicPharmacyBranchPageDto {
  @ApiProperty({ type: [PublicPharmacyBranchDto] })
  items!: PublicPharmacyBranchDto[];

  /** Siempre `null`: la lista entera entra en una página (tope 200). */
  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  totalHint!: number | null;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}

/** Un renglón de la receta que la sucursal sí tiene en stock. */
export class PublicBranchMatchDto {
  /** Lo que la persona escribió. */
  @ApiProperty()
  term!: string;

  @ApiProperty()
  genericName!: string;

  @ApiProperty({ type: String, nullable: true })
  brandName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  presentation!: string | null;

  /** Texto exacto; `null` si no hay precio publicado. */
  @ApiProperty({ type: String, nullable: true, example: '4.50' })
  price!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currency!: string | null;
}

/** Qué tiene una sucursal de la receta. */
export class PublicBranchAvailabilityDto {
  @ApiProperty({ type: PublicPharmacyBranchDto })
  branch!: PublicPharmacyBranchDto;

  @ApiProperty({ type: [PublicBranchMatchDto] })
  matches!: PublicBranchMatchDto[];

  /** Los renglones que no tiene o tiene agotados. */
  @ApiProperty({ type: [String] })
  missing!: string[];

  @ApiProperty()
  complete!: boolean;

  /** Suma exacta de lo encontrado; `null` si no hay nada, falta un precio o mezclan monedas. */
  @ApiProperty({ type: String, nullable: true, example: '12.50' })
  totalAmount!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currency!: string | null;

  /** En línea recta, una decimal; `null` sin ubicación de origen o sin punto. */
  @ApiProperty({ type: Number, nullable: true, example: 1.2 })
  distanceKm!: number | null;
}

/** Respuesta de la búsqueda de una receta entre las sucursales. */
export class PublicBranchAvailabilityResponseDto {
  /** Ya ordenadas: completas primero, después la más cercana. */
  @ApiProperty({ type: [PublicBranchAvailabilityDto] })
  items!: PublicBranchAvailabilityDto[];

  @ApiProperty()
  count!: number;

  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;
}
