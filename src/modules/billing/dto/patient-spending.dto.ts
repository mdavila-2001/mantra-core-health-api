import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

/**
 * Contrato de `GET /patient-spending/me` (P44): lo que el paciente autenticado
 * gastó en su salud, movimiento por movimiento.
 *
 * La forma la fijó el frontend (`core/data-access/patient-spending/
 * patient-spending.dto.ts`), que la construyó contra su simulador; este
 * archivo la reproduce campo por campo y sólo agrega `truncated`, que es
 * aditivo.
 */

/** `YYYY-MM-DD`: el formato del rango. El día de calendario se valida aparte. */
export const SPENDING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Tope de movimientos por respuesta, y valor por defecto de `limit`. */
export const PATIENT_SPENDING_MAX_LIMIT = 1000;

const DATE_MESSAGE = 'debe ser una fecha con formato YYYY-MM-DD';

/** Rango pedido: ambos extremos inclusive. */
export class PatientSpendingQueryDto {
  /** Primer día del rango (inclusive). */
  @ApiProperty({ example: '2025-01-01', description: 'Desde (inclusive)' })
  @Matches(SPENDING_DATE_PATTERN, { message: `from ${DATE_MESSAGE}` })
  from!: string;

  /** Último día del rango (inclusive). Lo posterior a hoy no se gastó. */
  @ApiProperty({ example: '2026-10-26', description: 'Hasta (inclusive)' })
  @Matches(SPENDING_DATE_PATTERN, { message: `to ${DATE_MESSAGE}` })
  to!: string;

  /** Cuántos movimientos devolver como mucho (por defecto el tope). */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: PATIENT_SPENDING_MAX_LIMIT,
    default: PATIENT_SPENDING_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PATIENT_SPENDING_MAX_LIMIT)
  limit?: number;
}

/** Un concepto ya resuelto a su forma legible. */
@ApiSchema({ name: 'PatientSpendingConceptDto' })
export class PatientSpendingConceptDto {
  /** Código estable del concepto (`SPEND_*`). */
  @ApiProperty({ example: 'SPEND_CONSULTATION' })
  code!: string;

  /** Rótulo del catálogo. */
  @ApiProperty({ example: 'Consultations' })
  display!: string;
}

/**
 * Un gasto de salud: una factura emitida al paciente. Los importes son texto
 * decimal exacto con dos decimales, en la moneda de la respuesta, y siempre
 * `paidAmount = grossAmount − coveredAmount − discountAmount`. Una nota de
 * crédito llega con importes negativos: es la devolución de un gasto anterior.
 */
@ApiSchema({ name: 'PatientSpendingMovementDto' })
export class PatientSpendingMovementDto {
  /** Id de la factura que lo respalda. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Instante ISO 8601 del cobro. */
  @ApiProperty({ example: '2026-10-20T14:05:00.000Z' })
  occurredAt!: string;

  /** Qué se cobró, en palabras. */
  @ApiProperty()
  description!: string;

  /** Categoría del gasto (`SPEND_*`). */
  @ApiProperty({ type: PatientSpendingConceptDto })
  category!: PatientSpendingConceptDto;

  /** Quién cobró. `null` si no se pudo resolver su nombre. */
  @ApiProperty({ type: String, nullable: true })
  providerName!: string | null;

  /** Lo que costó, antes de cobertura y descuentos. */
  @ApiProperty({ example: '300.00' })
  grossAmount!: string;

  /** La parte que pagó el seguro. */
  @ApiProperty({ example: '150.00' })
  coveredAmount!: string;

  /** La parte que se descontó. */
  @ApiProperty({ example: '0.00' })
  discountAmount!: string;

  /** Lo que le tocó pagar al paciente. */
  @ApiProperty({ example: '150.00' })
  paidAmount!: string;
}

/** Respuesta de `GET /patient-spending/me`. */
@ApiSchema({ name: 'PatientSpendingResponseDto' })
export class PatientSpendingResponseDto {
  /** Código ISO 4217 de todos los importes. */
  @ApiProperty({ example: 'BOB' })
  currency!: string;

  /** El rango pedido, tal como llegó. */
  @ApiProperty({ example: '2025-01-01' })
  from!: string;

  @ApiProperty({ example: '2026-10-26' })
  to!: string;

  /** Del más reciente al más antiguo. */
  @ApiProperty({ type: [PatientSpendingMovementDto] })
  items!: PatientSpendingMovementDto[];

  /**
   * `true` si el tope (`limit`) dejó movimientos del rango afuera: las sumas
   * sobre `items` no son el total del rango.
   */
  @ApiProperty()
  truncated!: boolean;
}
