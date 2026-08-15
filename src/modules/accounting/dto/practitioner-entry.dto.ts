import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Carril 18 — contabilidad de auto-servicio del doctor. Estos DTOs son capas
 * finas SOBRE el motor de partida doble que ya existía (`LedgerService`): no
 * reinventan el asiento contable, solo dejan que un `PRACTITIONER` dispare uno
 * balanceado de dos líneas sin tener que conocer el contrato completo de
 * `PostJournalDto`/`journal-transactions`.
 */

const POSITIVE_AMOUNT_REGEX = /^\d+(\.\d+)?$/;

/** Una consulta pagada, todavía sin asiento contable que la refleje. */
export class PaidConsultationDto {
  /** Factura pagada (`billing.invoices.id`). */
  @ApiProperty({ format: 'uuid' }) invoiceId!: string;
  /** Número de factura, legible. */
  @ApiProperty() invoiceNumber!: string;
  /** Encuentro clínico del que salió la factura. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;
  /** Cita de la que salió el encuentro, si la hay. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  appointmentId!: string | null;
  /** Paciente atendido. */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;
  /** Fecha de emisión de la factura. */
  @ApiProperty() issueDate!: Date;
  /** Importe pagado. */
  @ApiProperty() paidTotal!: string;
  /** Moneda (concepto), si la factura la declara. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;
}

/** Respuesta de `GET /accounting/practitioner/paid-consultations`. */
export class PaidConsultationsResponseDto {
  @ApiProperty({ type: [PaidConsultationDto] }) items!: PaidConsultationDto[];
  @ApiProperty() count!: number;
}

/**
 * Cuerpo de `POST /accounting/practitioner/consultation-income`.
 *
 * El importe NO se recibe del cliente: se toma de `invoices.paid_total`, para
 * que el asiento no pueda registrar un monto distinto del efectivamente
 * cobrado (spec: "asociar automáticamente los ingresos con las citas
 * pagadas").
 */
export class RegisterConsultationIncomeDto {
  /** Práctica propietaria del asiento; debe ser una a la que el profesional esté vinculado. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /** Factura pagada que origina el ingreso. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  invoiceId!: string;

  /** Cuenta a debitar (caja/banco/cuentas por cobrar). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  debitAccountId!: string;

  /** Cuenta a acreditar (ingresos por consultas). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  creditAccountId!: string;

  /** Fecha contable del asiento. */
  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  transactionDate!: string;

  /** Descripción libre; si se omite, se genera una a partir de la factura. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Comprobante ya cargado (`common.files`) a adjuntar al asiento. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

/** Los otros dos registros simples que puede disparar el doctor sin pasar por partida doble a mano. */
export type SimpleEntryKind = 'EXPENSE' | 'OTHER_INCOME';
const SIMPLE_ENTRY_KINDS: readonly SimpleEntryKind[] = [
  'EXPENSE',
  'OTHER_INCOME',
];

/** Cuerpo de `POST /accounting/practitioner/entries` (gasto / otro ingreso). */
export class RegisterSimpleEntryDto {
  /** Práctica propietaria del asiento; debe ser una a la que el profesional esté vinculado. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /** Qué tipo de movimiento es (determina `sourceDocumentType` y el texto por defecto). */
  @ApiProperty({ enum: SIMPLE_ENTRY_KINDS })
  @IsIn(SIMPLE_ENTRY_KINDS)
  kind!: SimpleEntryKind;

  /** Cuenta a debitar. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  debitAccountId!: string;

  /** Cuenta a acreditar. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  creditAccountId!: string;

  /** Importe positivo del movimiento. */
  @ApiProperty({ example: '100.00' })
  @IsNumberString()
  @Matches(POSITIVE_AMOUNT_REGEX, {
    message: 'El importe debe ser positivo (sin signo)',
  })
  amount!: string;

  /** Fecha contable del asiento. */
  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  transactionDate!: string;

  /** Descripción del movimiento (obligatoria: sin ella, un gasto es un número sin motivo). */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  description!: string;

  /** Comprobante ya cargado (`common.files`) a adjuntar al asiento. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

/** Respuesta común de los tres endpoints de registro. */
export class PractitionerEntryResponseDto {
  /** Asiento creado (en DRAFT: ver `docs` para el flujo hasta POSTED). */
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
  @ApiProperty() transactionNumber!: string;
  @ApiProperty() status!: string;
  @ApiProperty() totalAmount!: string;
  /** Factura anclada a este asiento, si el registro fue un ingreso de consulta. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  invoiceId!: string | null;
  /** Notificación in-app generada para el doctor, si la infraestructura de mensajería la aceptó. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  notificationRequestId!: string | null;
}
