import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Importe positivo (sin signo). El motor de partida doble solo compara sumas de
 * DEBIT contra CREDIT (`assertBalanced`); sin esta guarda una línea negativa
 * "balancea" igual (DEBIT 100 / DEBIT -50 / CREDIT 50) y viola la invariante.
 */
const POSITIVE_AMOUNT_REGEX = /^\d+(\.\d+)?$/;

/** Dirección contable de una línea del mayor. */
export type LedgerDirection = 'DEBIT' | 'CREDIT';

/** Una línea (partida) del asiento. La suma de DEBIT debe igualar la de CREDIT. */
export class LedgerLineDto {
  /**
   * Identificador asociado a account.
   */
  @ApiProperty({ description: 'Cuenta contable postable', format: 'uuid' })
  @IsUUID()
  accountId!: string;

  /**
   * Valor de direction mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Dirección de la partida',
    enum: ['DEBIT', 'CREDIT'],
  })
  @IsIn(['DEBIT', 'CREDIT'])
  direction!: LedgerDirection;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe positivo de la línea',
    example: '100.00',
  })
  @IsNumberString()
  @Matches(POSITIVE_AMOUNT_REGEX, {
    message: 'El importe de la línea debe ser positivo (sin signo)',
  })
  amount!: string;

  /**
   * Identificador asociado a cost center.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  /**
   * Identificador asociado a profit center.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  profitCenterId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de fx rate mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de cambio a moneda base',
    example: '3.75',
  })
  @IsOptional()
  @IsNumberString()
  fxRate?: string;

  /**
   * Valor de amount base mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe convertido a moneda base',
    example: '375.00',
  })
  @IsOptional()
  @IsNumberString()
  amountBase?: string;

  /**
   * Valor de memo mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}

/** Cuerpo de `POST /accounting/journal-transactions` (UC-16-01). */
export class PostJournalDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({
    description: 'Práctica propietaria del asiento',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de transaction number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Número de asiento (único por práctica); autogenerado si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  transactionNumber?: string;

  /**
   * Valor de transaction date mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Fecha contable',
    format: 'date',
    example: '2026-01-31',
  })
  @IsDateString()
  transactionDate!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @ApiPropertyOptional({
    description: 'Periodo fiscal ABIERTO',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /**
   * Valor de reference mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  /**
   * Tipo del documento origen que motiva el asiento (p. ej. `'INVOICE'`,
   * `'APPOINTMENT'`, `'EXPENSE'`). Carril 18 — es lo que permite asociar
   * automáticamente un ingreso con la cita/factura pagada que lo originó
   * (spec: "asociar automáticamente los ingresos con las citas pagadas"),
   * sin inventar una FK nueva: la columna ya existía en `journal_transactions`
   * pero ningún DTO la exponía.
   */
  @ApiPropertyOptional({
    description:
      'Tipo del documento origen (p. ej. INVOICE, APPOINTMENT, EXPENSE)',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sourceDocumentType?: string;

  /** Identificador del documento origen (p. ej. `billing.invoices.id`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceDocumentId?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({
    type: [LedgerLineDto],
    description: 'Líneas balanceadas (>=2)',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => LedgerLineDto)
  lines!: LedgerLineDto[];
}

/**
 * Cuerpo común de los comandos de transición del asiento (ALOVIDA C-17):
 * `classify`, `submit-review`, `approve`, `post`. Todos los campos son opcionales;
 * cada comando usa los que le apliquen (p. ej. `post` puede enlazar el periodo
 * fiscal si el borrador no lo fijó; `approve`/`post` admiten una nota de auditoría).
 */
export class JournalTransitionDto {
  /**
   * Identificador asociado a fiscal period.
   */
  @ApiPropertyOptional({
    description:
      'Periodo fiscal ABIERTO a enlazar en el posteo (solo `post`, si el borrador no lo fijó)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  /**
   * Valor de note mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nota de auditoría de la transición',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Cuerpo de `POST /accounting/journal-transactions/:id/reverse` (UC-16-03). */
export class ReverseJournalDto {
  /**
   * Identificador asociado a fiscal period.
   */
  @ApiPropertyOptional({
    description: 'Periodo fiscal ABIERTO de la reversa',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo de la reversa', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /accounting/postings/determine-accounts` (UC-16-02). */
export class DetermineAccountsDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant al que aplica la regla', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a posting scenario concept.
   */
  @ApiProperty({ description: 'Escenario de posteo', format: 'uuid' })
  @IsUUID()
  postingScenarioConceptId!: string;

  /**
   * Identificador asociado a account role concept.
   */
  @ApiPropertyOptional({ description: 'Rol de cuenta buscado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountRoleConceptId?: string;
}

/** Cuerpo de `POST /accounting/journal-transactions/:id/files` (UC-16-13). */
export class AttachFileDto {
  /**
   * Identificador asociado a file.
   */
  @ApiProperty({
    description: 'Archivo ya cargado en object storage',
    format: 'uuid',
  })
  @IsUUID()
  fileId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;
}

/**
 * Evidencia de la clasificación contable (MCH-018). Sin regla aplicable el
 * asiento no queda auto-clasificado y esto explica por qué fue a revisión.
 */
export class JournalClassificationDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado de evaluar el juego de reglas',
    enum: ['CLASIFICADA', 'SIN_REGLA', 'AMBIGUA'],
  })
  decision!: string;
  /**
   * Valor de ruleset version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión del juego de reglas evaluado' })
  rulesetVersion!: string;
  /**
   * Identificador asociado a rule.
   */
  @ApiPropertyOptional({ description: 'Regla que decidió la imputación' })
  ruleId?: string;
  /**
   * Identificador asociado a transaction type concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  transactionTypeConceptId?: string;
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Explicación legible de la decisión' })
  reason!: string;
}

/** Respuesta con el asiento posteado. */
export class JournalTransactionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de transaction number mantenido por la instancia.
   */
  @ApiProperty() transactionNumber!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de total amount mantenido por la instancia.
   */
  @ApiProperty() totalAmount!: string;
  /**
   * Valor de line count mantenido por la instancia.
   */
  @ApiProperty({ type: Number }) lineCount!: number;
  /**
   * Valor de posted at mantenido por la instancia.
   */
  @ApiProperty() postedAt!: Date | null;
  /**
   * Evidencia de la clasificación; sólo la devuelve `classify` (MCH-018).
   */
  @ApiPropertyOptional({ type: () => JournalClassificationDto })
  classification?: JournalClassificationDto;
}

/** Respuesta de la determinación de cuentas. */
export class DeterminedAccountResponseDto {
  /**
   * Identificador asociado a rule.
   */
  @ApiProperty({ format: 'uuid' }) ruleId!: string;
  /**
   * Identificador asociado a target account.
   */
  @ApiProperty({ format: 'uuid' }) targetAccountId!: string;
  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiProperty({ type: Number, nullable: true }) priority!: number | null;
}

/** Respuesta genérica de estado. */
export class AccountingStatusDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ example: true }) ok!: boolean;
  /**
   * Identificador único de la instancia.
   */
  @ApiPropertyOptional({ format: 'uuid' }) id?: string;
}
