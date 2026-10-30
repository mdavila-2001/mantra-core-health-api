import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/** Tope de centros por respuesta de `GET /clinical/me/procedure-centers`. */
export const PROCEDURE_CENTERS_MAX_LIMIT = 50;

/**
 * Query de `GET /clinical/me/procedure-centers`.
 *
 * No lleva los procedimientos: los resuelve el servidor desde las órdenes del
 * titular. Lo que a una persona le pidieron es PHI y no viaja en la URL.
 */
export class ProcedureCentersQueryDto {
  /** Latitud WGS84 desde donde medir la distancia; va con `lng`. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  /** Longitud WGS84 desde donde medir la distancia; va con `lat`. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  /** Tope de centros. */
  @ApiPropertyOptional({ default: 20, maximum: PROCEDURE_CENTERS_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PROCEDURE_CENTERS_MAX_LIMIT)
  limit?: number;
}

/** Un procedimiento pedido al titular y todavía sin cumplir. */
export class PendingProcedureDto {
  /** La orden (`clinical.service_requests`). */
  @ApiProperty({ format: 'uuid' })
  serviceRequestId!: string;

  /** Qué se pidió (`code_concept_id` de la orden). */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /** Categoría de la orden: procedimiento o cardiología. */
  @ApiProperty({ format: 'uuid' })
  categoryConceptId!: string;

  /** Cuándo se pidió. */
  @ApiProperty()
  requestedAt!: Date;
}

/** Una sede que ofrece al menos uno de los procedimientos pedidos. */
export class ProcedureCenterDto {
  /** La sede (`practice.practice_sites`). */
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  /** El establecimiento al que pertenece la sede. */
  @ApiProperty({ format: 'uuid' })
  practiceId!: string;

  /** Nombre del establecimiento. */
  @ApiProperty()
  practiceName!: string;

  /** Nombre de la sede. */
  @ApiProperty()
  siteName!: string;

  /** Si ofrece todos los procedimientos pedidos. */
  @ApiProperty()
  complete!: boolean;

  /** Los conceptos pedidos que esta sede no ofrece. */
  @ApiProperty({ type: [String], format: 'uuid' })
  missingProcedureConceptIds!: string[];

  /** Distancia en línea recta desde el origen, o `null` sin origen o sin coordenadas. */
  @ApiProperty({ type: Number, nullable: true })
  distanceKm!: number | null;

  /** La dirección en una línea, o `null`. */
  @ApiProperty({ type: String, nullable: true })
  addressText!: string | null;

  /** Latitud de la sede, o `null`. */
  @ApiProperty({ type: Number, nullable: true })
  latitude!: number | null;

  /** Longitud de la sede, o `null`. */
  @ApiProperty({ type: Number, nullable: true })
  longitude!: number | null;
}

/** Respuesta de `GET /clinical/me/procedure-centers`. */
export class ProcedureCentersResponseDto {
  /** Lo que le pidieron al titular y sigue pendiente. */
  @ApiProperty({ type: [PendingProcedureDto] })
  procedures!: PendingProcedureDto[];

  /** Las sedes: completas primero, después la más cercana, después por nombre. */
  @ApiProperty({ type: [ProcedureCenterDto] })
  centers!: ProcedureCenterDto[];

  /** Cuántas sedes casaron en total, antes del tope. */
  @ApiProperty()
  total!: number;

  /** Tope aplicado. */
  @ApiProperty()
  limit!: number;
}
