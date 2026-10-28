import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * P49 — la contabilidad simple del doctor: cuentas, gastos/activos/deudas
 * (registros) y transacciones debe/haber, más los tres números de arriba.
 *
 * **Los campos de contenido (nombre, fecha, importe…) sólo declaran su tipo
 * estructural.** El `ValidationPipe` global responde 400 con frases en inglés
 * de `class-validator`; la spec exige 422 con el motivo en castellano, porque
 * el front lo muestra tal cual. Por eso el contenido lo valida el servicio y
 * este DTO sólo cierra el mass-assignment y la forma (`forbidNonWhitelisted`).
 *
 * Los importes viajan como cadena decimal (`'1250.00'`).
 */

/** Las cinco clases de cuenta. Ninguna más: es la contabilidad de un consultorio. */
export const SIMPLE_ACCOUNT_CLASSES = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'INCOME',
  'EXPENSE',
] as const;
export type SimpleAccountClass = (typeof SIMPLE_ACCOUNT_CLASSES)[number];

/** Las tres clases de registro que el doctor carga a mano. */
export const SIMPLE_RECORD_KINDS = ['EXPENSE', 'ASSET', 'DEBT'] as const;
export type SimpleRecordKind = (typeof SIMPLE_RECORD_KINDS)[number];

/** El período de los tres números de arriba. */
export const SIMPLE_SUMMARY_PERIODS = ['month', 'year'] as const;
export type SimpleSummaryPeriod = (typeof SIMPLE_SUMMARY_PERIODS)[number];

/* ---- lecturas ------------------------------------------------------------ */

/** Query de las lecturas que sólo piden la práctica. */
export class SimpleAccountingPracticeQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;
}

/** Query de `GET .../simple/summary`. */
export class SimpleSummaryQueryDto extends SimpleAccountingPracticeQueryDto {
  @ApiPropertyOptional({ enum: SIMPLE_SUMMARY_PERIODS, default: 'month' })
  @IsOptional()
  @IsIn(SIMPLE_SUMMARY_PERIODS)
  period?: SimpleSummaryPeriod;
}

/** Query de `GET .../simple/records`. */
export class SimpleRecordsQueryDto extends SimpleAccountingPracticeQueryDto {
  @ApiPropertyOptional({
    enum: SIMPLE_RECORD_KINDS,
    description: 'Sin `kind` devuelve los tres.',
  })
  @IsOptional()
  @IsIn(SIMPLE_RECORD_KINDS)
  kind?: SimpleRecordKind;
}

/** Los tres números que el doctor ve primero. */
export class SimplePractitionerSummaryDto {
  @ApiProperty({ enum: SIMPLE_SUMMARY_PERIODS }) period!: SimpleSummaryPeriod;
  @ApiProperty({
    format: 'date',
    description: 'Primer día del período, `YYYY-MM-DD`.',
  })
  from!: string;
  @ApiProperty({
    format: 'date',
    description: 'Último día del período, `YYYY-MM-DD`.',
  })
  to!: string;
  @ApiProperty({
    description:
      'Personas distintas con una consulta «Atendida» en el período.',
  })
  patientsSeen!: number;
  @ApiProperty({
    description: 'Consultas atendidas: una persona puede venir dos veces.',
  })
  consultations!: number;
  @ApiProperty({
    description:
      'Consultas pagadas del período. Cadena decimal con dos decimales.',
  })
  collected!: string;
  @ApiProperty({
    description:
      'A hoy: solicitudes enviadas sin dictamen (por lo facturado) más aprobadas sin pagar (por lo aprobado). No depende del período.',
  })
  expectedFromInsurers!: string;
  @ApiProperty({ description: 'Cuántas solicitudes componen ese saldo.' })
  pendingClaims!: number;
}

/* ---- cuentas ------------------------------------------------------------- */

/** Una cuenta del gestor. */
export class SimpleAccountDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Código corto (`5.3`); lo asigna el servidor.' })
  code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: SIMPLE_ACCOUNT_CLASSES })
  accountClass!: SimpleAccountClass;
  @ApiProperty({
    description:
      'Viene sembrada con la práctica: se puede renombrar, no borrar ni cambiar de clase.',
  })
  seeded!: boolean;
}

/** Respuesta de `GET .../simple/accounts`. */
export class SimpleAccountsResponseDto {
  @ApiProperty({ type: [SimpleAccountDto] }) items!: SimpleAccountDto[];
}

/** Cuerpo de `PUT .../simple/accounts/:id`. */
export class SimpleAccountInputDto {
  @ApiProperty({ maxLength: 80 })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: SIMPLE_ACCOUNT_CLASSES })
  @IsOptional()
  @IsString()
  accountClass?: string;
}

/** Cuerpo de `POST .../simple/accounts`. */
export class CreateSimpleAccountDto extends SimpleAccountInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;
}

/* ---- gastos, activos y deudas -------------------------------------------- */

/** Un gasto, un activo o una deuda. */
export class SimpleRecordDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: SIMPLE_RECORD_KINDS }) kind!: SimpleRecordKind;
  @ApiProperty({ format: 'date', description: '`YYYY-MM-DD`.' })
  date!: string;
  @ApiProperty({
    format: 'uuid',
    description:
      'El tipo: una cuenta de la clase que corresponde (gasto → EXPENSE, activo → ASSET, deuda → LIABILITY).',
  })
  accountId!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ description: 'Cadena decimal, siempre mayor a cero.' })
  amount!: string;
}

/** Respuesta de `GET .../simple/records`. */
export class SimpleRecordsResponseDto {
  @ApiProperty({ type: [SimpleRecordDto] }) items!: SimpleRecordDto[];
}

/** Cuerpo de `PUT .../simple/records/:id` (el `kind` de un registro no cambia). */
export class SimpleRecordInputDto {
  @ApiProperty({ enum: SIMPLE_RECORD_KINDS })
  @IsOptional()
  @IsString()
  kind?: string;

  @ApiProperty({ format: 'date' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ format: 'uuid' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiProperty({ maxLength: 160 })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Cadena decimal > 0, hasta dos decimales.' })
  @IsOptional()
  @IsString()
  amount?: string;
}

/** Cuerpo de `POST .../simple/records`. */
export class CreateSimpleRecordDto extends SimpleRecordInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;
}

/* ---- transacciones debe/haber -------------------------------------------- */

/** Una transacción: debe y haber, nada más. */
export class SimpleTransactionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'date', description: '`YYYY-MM-DD`.' })
  date!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: 'uuid' }) debitAccountId!: string;
  @ApiProperty({ format: 'uuid' }) creditAccountId!: string;
  @ApiProperty({ description: 'Cadena decimal, siempre mayor a cero.' })
  amount!: string;
}

/** Respuesta de `GET .../simple/transactions`. */
export class SimpleTransactionsResponseDto {
  @ApiProperty({ type: [SimpleTransactionDto] }) items!: SimpleTransactionDto[];
}

/** Cuerpo de `PUT .../simple/transactions/:id`. */
export class SimpleTransactionInputDto {
  @ApiProperty({ format: 'date' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ maxLength: 160 })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ format: 'uuid', description: 'Cuenta del debe.' })
  @IsOptional()
  @IsString()
  debitAccountId?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Cuenta del haber; distinta de la del debe.',
  })
  @IsOptional()
  @IsString()
  creditAccountId?: string;

  @ApiProperty({ description: 'Cadena decimal > 0, hasta dos decimales.' })
  @IsOptional()
  @IsString()
  amount?: string;
}

/** Cuerpo de `POST .../simple/transactions`. */
export class CreateSimpleTransactionDto extends SimpleTransactionInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;
}
