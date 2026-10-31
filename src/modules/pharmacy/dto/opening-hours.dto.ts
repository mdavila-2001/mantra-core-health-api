import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsString, Matches, ValidateIf } from 'class-validator';
import { IsStrictBoolean } from './strict-boolean';
import { ISO_INSTANT_WITH_OFFSET } from '../services/opening-hours.time';

/** Quién declaró el turno (P34, D1). */
export type OnCallShiftSource = 'PHARMACY' | 'PLATFORM';

/** Estado de un turno. */
export type OnCallShiftStatus = 'ACTIVE' | 'CANCELLED';

/** Qué sedes devuelve `GET /public/pharmacies/open-now`. */
export type OpenNowMode = 'any' | '24h' | 'on-call';

/** Los modos aceptados, en el orden en que se documentan. */
export const OPEN_NOW_MODES: readonly OpenNowMode[] = ['any', '24h', 'on-call'];

/** Cuerpo de `PUT /pharmacies/{pharmacyId}/sites/{siteId}/open-24h`. */
@ApiSchema({ name: 'PharmacySetOpen24hDto' })
export class SetOpen24hDto {
  /**
   * `true` abre 24 h, `false` no, `null` retira la declaración. Obligatorio:
   * un cuerpo vacío no es «no».
   */
  @ApiProperty({
    type: Boolean,
    nullable: true,
    description:
      '`true`: abre las 24 h · `false`: no · `null`: retira la declaración (vuelve a «no declarado»)',
  })
  @ValidateIf((dto: SetOpen24hDto) => dto.open24h !== null)
  @IsStrictBoolean()
  open24h!: boolean | null;
}

/** Cuerpo de `POST /pharmacies/{pharmacyId}/sites/{siteId}/on-call-shifts`. */
@ApiSchema({ name: 'PharmacyCreateOnCallShiftDto' })
export class CreateOnCallShiftDto {
  /** Inicio del turno, con desplazamiento explícito. */
  @ApiProperty({
    description:
      'Inicio, ISO-8601 con desplazamiento obligatorio (p. ej. `2026-10-26T20:00:00-04:00`)',
    example: '2026-10-26T20:00:00-04:00',
  })
  @IsString()
  @Matches(ISO_INSTANT_WITH_OFFSET, {
    message:
      'startsAt debe ser ISO-8601 con desplazamiento explícito (Z o ±hh:mm)',
  })
  startsAt!: string;

  /** Fin del turno (exclusivo), con desplazamiento explícito. */
  @ApiProperty({
    description:
      'Fin (exclusivo), ISO-8601 con desplazamiento obligatorio. Como mucho 72 h después del inicio',
    example: '2026-10-27T08:00:00-04:00',
  })
  @IsString()
  @Matches(ISO_INSTANT_WITH_OFFSET, {
    message:
      'endsAt debe ser ISO-8601 con desplazamiento explícito (Z o ±hh:mm)',
  })
  endsAt!: string;
}

/** Un turno de guardia, con la hora en UTC y en la hora local de la sede. */
@ApiSchema({ name: 'PharmacyOnCallShiftDto' })
export class OnCallShiftDto {
  /** Identificador del turno. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Sede del turno. */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /** Inicio (instante UTC). */
  @ApiProperty({ format: 'date-time' })
  startsAt!: string;

  /** Fin, exclusivo (instante UTC). */
  @ApiProperty({ format: 'date-time' })
  endsAt!: string;

  /** Inicio en la hora local de la sede. */
  @ApiProperty({ example: '2026-10-26T20:00:00-04:00' })
  startsAtLocal!: string;

  /** Fin en la hora local de la sede. */
  @ApiProperty({ example: '2026-10-27T08:00:00-04:00' })
  endsAtLocal!: string;

  /** Huso con que se escribió la hora local. */
  @ApiProperty({ example: 'America/La_Paz' })
  timeZone!: string;

  /** Quién lo declaró. */
  @ApiProperty({ enum: ['PHARMACY', 'PLATFORM'] })
  source!: OnCallShiftSource;

  /** Estado. */
  @ApiProperty({ enum: ['ACTIVE', 'CANCELLED'] })
  status!: OnCallShiftStatus;

  /** Si está vigente en `asOf`. */
  @ApiProperty()
  current!: boolean;
}

/** El horario declarado de una sede: 24 h y sus turnos vigentes y próximos. */
@ApiSchema({ name: 'PharmacySiteOpeningHoursDto' })
export class SiteOpeningHoursDto {
  /** Sede. */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /** Nombre de la sede. */
  @ApiProperty()
  siteName!: string;

  /** Huso de la sede. */
  @ApiProperty({ example: 'America/La_Paz' })
  timeZone!: string;

  /** `null` = no lo declaró. */
  @ApiProperty({ type: Boolean, nullable: true })
  open24h!: boolean | null;

  /** Turnos activos que todavía no terminaron, del más próximo al más lejano. */
  @ApiProperty({ type: [OnCallShiftDto] })
  shifts!: OnCallShiftDto[];
}

/** Respuesta de `GET /pharmacies/{pharmacyId}/opening-hours`. */
@ApiSchema({ name: 'PharmacyOpeningHoursDto' })
export class PharmacyOpeningHoursDto {
  /** Farmacia. */
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  /** Instante de referencia de `current`. */
  @ApiProperty({ format: 'date-time' })
  asOf!: string;

  /** Sedes activas de la farmacia. */
  @ApiProperty({ type: [SiteOpeningHoursDto] })
  sites!: SiteOpeningHoursDto[];
}

/** El turno vigente, tal como se publica. */
@ApiSchema({ name: 'PublicOnCallNowDto' })
export class PublicOnCallNowDto {
  /** Inicio (instante UTC). */
  @ApiProperty({ format: 'date-time' })
  startsAt!: string;

  /** Fin (instante UTC). */
  @ApiProperty({ format: 'date-time' })
  endsAt!: string;

  /** Fin en la hora local de la sede. */
  @ApiProperty({ example: '2026-10-27T08:00:00-04:00' })
  endsAtLocal!: string;

  /** Quién lo declaró: la lectura pública lo dice, no lo esconde. */
  @ApiProperty({ enum: ['PHARMACY', 'PLATFORM'] })
  source!: OnCallShiftSource;
}

/** Una sede abierta ahora. */
@ApiSchema({ name: 'PublicOpenNowItemDto' })
export class PublicOpenNowItemDto {
  /** Sede. */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /** Nombre de la sede. */
  @ApiProperty()
  siteName!: string;

  /** Nombre comercial de la farmacia. */
  @ApiProperty()
  pharmacyName!: string;

  /** Slug de la ficha pública de la farmacia. */
  @ApiProperty()
  pharmacySlug!: string;

  /** Dirección en una línea. */
  @ApiPropertyOptional({ type: String, nullable: true })
  addressText!: string | null;

  /** Ciudad. */
  @ApiPropertyOptional({ type: String, nullable: true })
  city!: string | null;

  /** Latitud WGS84. */
  @ApiPropertyOptional({ type: Number, nullable: true })
  latitude!: number | null;

  /** Longitud WGS84. */
  @ApiPropertyOptional({ type: Number, nullable: true })
  longitude!: number | null;

  /** Distancia en línea recta, si viajó el origen. */
  @ApiPropertyOptional({ type: Number, nullable: true })
  distanceKm!: number | null;

  /** La sede declaró abrir 24 h. */
  @ApiProperty()
  open24h!: boolean;

  /** El turno vigente, o `null`. */
  @ApiPropertyOptional({ type: PublicOnCallNowDto, nullable: true })
  onCall!: PublicOnCallNowDto | null;

  /** Huso de la sede. */
  @ApiProperty({ example: 'America/La_Paz' })
  timeZone!: string;
}

/** Respuesta de `GET /public/pharmacies/open-now`. */
@ApiSchema({ name: 'PublicOpenNowPageDto' })
export class PublicOpenNowPageDto {
  /** Las sedes de esta página. */
  @ApiProperty({ type: [PublicOpenNowItemDto] })
  items!: PublicOpenNowItemDto[];

  /** Cursor de la página siguiente, o `null`. */
  @ApiPropertyOptional({ type: String, nullable: true })
  nextCursor!: string | null;

  /** El instante con que se decidió «abierta ahora» (UTC). */
  @ApiProperty({ format: 'date-time' })
  asOf!: string;

  /** `asOf` en la hora de Bolivia. */
  @ApiProperty({ example: '2026-10-26T03:00:00-04:00' })
  asOfLocal!: string;

  /** El huso de `asOfLocal`. */
  @ApiProperty({ example: 'America/La_Paz' })
  timeZone!: string;
}
