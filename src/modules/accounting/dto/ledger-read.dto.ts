import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/** Tope por omisión de las lecturas del mayor. */
export const LEDGER_DEFAULT_LIMIT = 100;
const LEDGER_MAX_LIMIT = 500;

/**
 * Query del **libro diario**.
 *
 * `practiceId` es obligatorio y no es burocracia: el plan de cuentas y los
 * asientos son de una práctica: un diario «de todo» mezclaría libros de
 * entidades distintas, que es exactamente lo que la contabilidad separa.
 */
export class ListJournalQueryDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid', description: 'Práctica dueña del libro' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Acotar a un período' })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Acotar a un estado (borrador, posteado, reversado…)',
  })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;

  /**
   * Inicio de la ventana por fecha contable.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  /**
   * Fin de la ventana por fecha contable, inclusive.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: LEDGER_DEFAULT_LIMIT,
    maximum: LEDGER_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEDGER_MAX_LIMIT)
  limit?: number;
}

/** Query del balance de sumas y saldos. */
export class TrialBalanceQueryDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  /**
   * Inicio de la ventana.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  /**
   * Fin de la ventana, inclusive.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

/** Una cuenta del plan. */
export class AccountItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: '1.1.01' }) code!: string;
  @ApiProperty({ example: 'Banco' }) name!: string;
  @ApiProperty({ format: 'uuid' }) accountTypeConceptId!: string;
  /** Deudora o acreedora: es lo que da signo al saldo. */
  @ApiProperty({ format: 'uuid' }) normalBalanceConceptId!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) parentAccountId!:
    string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) currencyConceptId!:
    string | null;
}

/** Respuesta del plan de cuentas. */
export class ChartOfAccountsResponseDto {
  @ApiProperty({ type: [AccountItemDto] }) items!: AccountItemDto[];
  @ApiProperty() count!: number;
  @ApiProperty() limit!: number;
}

/** Un asiento tal como lo lista el diario. */
export class JournalTransactionItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true }) transactionNumber!: string | null;
  @ApiProperty({ type: String, format: 'date' }) transactionDate!: Date;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) fiscalPeriodId!:
    string | null;
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  transactionTypeConceptId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) currencyConceptId!:
    string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Importe total, decimal como texto',
  })
  totalAmount!: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  postedAt!: Date | null;
}

/** Respuesta del libro diario. */
export class ListJournalResponseDto {
  @ApiProperty({ type: [JournalTransactionItemDto] })
  items!: JournalTransactionItemDto[];
  @ApiProperty() count!: number;
  @ApiProperty() limit!: number;
}

/** Una línea del asiento: contra qué cuenta y de qué lado. */
export class LedgerEntryItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ nullable: true }) lineNo!: number | null;
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  /** Debe o haber. */
  @ApiProperty({ format: 'uuid' }) directionConceptId!: string;
  @ApiProperty({ description: 'Importe en moneda base, decimal como texto' })
  amountBase!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) costCenterId!:
    string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) currencyConceptId!:
    string | null;
}

/** Un asiento con sus líneas — lo que se audita. */
export class JournalTransactionDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  @ApiPropertyOptional({ nullable: true }) transactionNumber!: string | null;
  @ApiProperty({ type: String, format: 'date' }) transactionDate!: Date;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) fiscalPeriodId!:
    string | null;
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) currencyConceptId!:
    string | null;
  @ApiPropertyOptional({ nullable: true }) totalAmount!: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  postedAt!: Date | null;
  @ApiProperty({ type: [LedgerEntryItemDto] }) lines!: LedgerEntryItemDto[];
}

/** Una fila del balance de sumas y saldos. */
export class TrialBalanceItemDto {
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  @ApiPropertyOptional({ nullable: true }) code!: string | null;
  @ApiPropertyOptional({ nullable: true }) name!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  normalBalanceConceptId!: string | null;
  @ApiProperty({ description: 'Suma del debe' }) debit!: string;
  @ApiProperty({ description: 'Suma del haber' }) credit!: string;
  /** Saldo **con signo por naturaleza** de la cuenta: un pasivo con saldo
   *  correcto sale positivo, no negativo. */
  @ApiProperty({ description: 'Saldo según la naturaleza de la cuenta' })
  balance!: string;
}

/** Respuesta del balance de sumas y saldos. */
export class TrialBalanceResponseDto {
  @ApiProperty({ type: [TrialBalanceItemDto] }) items!: TrialBalanceItemDto[];
  @ApiProperty() count!: number;
  @ApiProperty() totalDebit!: string;
  @ApiProperty() totalCredit!: string;
  /**
   * Si el total del debe iguala al del haber.
   *
   * Se declara en vez de dejar que quien lo lea sume dos columnas: es la
   * comprobación que se hace primero y de la que depende que el resto del
   * informe signifique algo.
   */
  @ApiProperty({ description: 'El conjunto cuadra' })
  balanced!: boolean;
  @ApiProperty({ description: 'Asientos POSTEADOS incluidos en la agregación' })
  transactionsIncluded!: number;
  /** Un balance recortado en silencio es un balance que miente. */
  @ApiProperty({
    description: 'Si se alcanzó el tope y el balance está incompleto',
  })
  truncated!: boolean;
}

/**
 * Query del **libro mayor** de una cuenta (TAREA-20 S3).
 *
 * A diferencia del libro diario (todos los asientos de la práctica), el libro
 * mayor es **por cuenta**: la contrapartida de cada asiento no aparece, sólo
 * su efecto sobre `accountId`. Pagina por cursor porque el movimiento de una
 * cuenta activa puede crecer sin límite.
 */
export class GeneralLedgerQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ format: 'uuid', description: 'Cuenta a leer' })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  /** Cursor opaco `base64url` emitido por la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    default: LEDGER_DEFAULT_LIMIT,
    maximum: LEDGER_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEDGER_MAX_LIMIT)
  limit?: number;
}

/** Un movimiento del libro mayor, con saldo corrido. */
export class GeneralLedgerEntryItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
  @ApiPropertyOptional({ nullable: true }) transactionNumber!: string | null;
  @ApiProperty({ type: String, format: 'date' }) transactionDate!: Date;
  /** Debe o haber. */
  @ApiProperty({ format: 'uuid' }) directionConceptId!: string;
  @ApiProperty({ description: 'Importe al debe, decimal como texto' })
  debit!: string;
  @ApiProperty({ description: 'Importe al haber, decimal como texto' })
  credit!: string;
  /** Saldo acumulado **con signo por naturaleza** hasta esta fila, inclusive. */
  @ApiProperty({ description: 'Saldo corrido según la naturaleza de la cuenta' })
  runningBalance!: string;
  @ApiPropertyOptional({ nullable: true }) memo!: string | null;
}

/** Respuesta del libro mayor de una cuenta. */
export class GeneralLedgerResponseDto {
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  @ApiPropertyOptional({ nullable: true }) code!: string | null;
  @ApiPropertyOptional({ nullable: true }) name!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  normalBalanceConceptId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) currencyConceptId!:
    string | null;
  /** Saldo acumulado **antes** de la primera fila de esta página. */
  @ApiProperty({ description: 'Saldo de apertura de la ventana pedida' })
  openingBalance!: string;
  @ApiProperty({ type: [GeneralLedgerEntryItemDto] })
  items!: GeneralLedgerEntryItemDto[];
  @ApiProperty() count!: number;
  @ApiProperty() limit!: number;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Cursor para la página siguiente, o null si no hay más',
  })
  nextCursor!: string | null;
}

/** Query compartida por estado de resultados y balance general. */
export class FinancialStatementQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Estado de resultados: inicio de la ventana',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    format: 'date',
    description:
      'Fin de la ventana (estado de resultados) o fecha de corte (balance general), inclusive',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    default: LEDGER_DEFAULT_LIMIT,
    maximum: LEDGER_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEDGER_MAX_LIMIT)
  limit?: number;
}

/** Una cuenta agregada en un estado financiero. */
export class FinancialStatementLineDto {
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  @ApiPropertyOptional({ nullable: true }) code!: string | null;
  @ApiPropertyOptional({ nullable: true }) name!: string | null;
  @ApiProperty({ format: 'uuid' }) accountTypeConceptId!: string;
  /** Saldo **con signo por naturaleza** de la cuenta. */
  @ApiProperty({ description: 'Importe según la naturaleza de la cuenta' })
  amount!: string;
}

/**
 * Estado de resultados (UC nuevo, TAREA-20 S3): ingresos y gastos POSTEADOS
 * de la ventana pedida. `netIncome = totalRevenue - totalExpense` y, por
 * construcción, agrega las mismas líneas que el libro mayor de esas cuentas
 * para el mismo período — no debe dar un número distinto (AC-20-7).
 */
export class IncomeStatementResponseDto {
  @ApiProperty({ type: [FinancialStatementLineDto] })
  revenueItems!: FinancialStatementLineDto[];
  @ApiProperty({ type: [FinancialStatementLineDto] })
  expenseItems!: FinancialStatementLineDto[];
  @ApiProperty() totalRevenue!: string;
  @ApiProperty() totalExpense!: string;
  @ApiProperty() netIncome!: string;
  @ApiProperty() count!: number;
  @ApiProperty() limit!: number;
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty({ description: 'Si se alcanzó el tope y el informe está incompleto' })
  truncated!: boolean;
}

/**
 * Balance general (UC nuevo, TAREA-20 S3): activo, pasivo y patrimonio a una
 * fecha de corte. Distinto del balance de sumas y saldos (`trial-balance`),
 * que suma **todas** las cuentas sin clasificar por tipo.
 *
 * `totalAssets === totalLiabilitiesAndEquity` es la identidad contable
 * fundamental (AC-20-6): se cumple **algebraicamente** porque
 * `equityItems`/`totalLiabilitiesAndEquity` incorporan el resultado del
 * período (`netIncomeOfPeriod`) como patrimonio — sin cerrarlo, activo no
 * cuadraría contra pasivo + patrimonio.
 */
export class BalanceSheetResponseDto {
  @ApiProperty({ type: [FinancialStatementLineDto] })
  assetItems!: FinancialStatementLineDto[];
  @ApiProperty({ type: [FinancialStatementLineDto] })
  liabilityItems!: FinancialStatementLineDto[];
  @ApiProperty({ type: [FinancialStatementLineDto] })
  equityItems!: FinancialStatementLineDto[];
  @ApiProperty({
    description: 'Ingresos menos gastos posteados hasta la fecha de corte',
  })
  netIncomeOfPeriod!: string;
  @ApiProperty() totalAssets!: string;
  @ApiProperty() totalLiabilities!: string;
  @ApiProperty({ description: 'Patrimonio declarado + resultado del período' })
  totalEquity!: string;
  @ApiProperty({ description: 'totalLiabilities + totalEquity' })
  totalLiabilitiesAndEquity!: string;
  @ApiProperty({ description: 'activo == pasivo + patrimonio' })
  balanced!: boolean;
  @ApiProperty() count!: number;
  @ApiProperty() limit!: number;
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty({ description: 'Si se alcanzó el tope y el informe está incompleto' })
  truncated!: boolean;
}
