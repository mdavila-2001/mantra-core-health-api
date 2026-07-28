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
  @ApiProperty({ description: 'Cuenta contable postable', format: 'uuid' })
  @IsUUID()
  accountId!: string;

  @ApiProperty({
    description: 'Dirección de la partida',
    enum: ['DEBIT', 'CREDIT'],
  })
  @IsIn(['DEBIT', 'CREDIT'])
  direction!: LedgerDirection;

  @ApiProperty({
    description: 'Importe positivo de la línea',
    example: '100.00',
  })
  @IsNumberString()
  @Matches(POSITIVE_AMOUNT_REGEX, {
    message: 'El importe de la línea debe ser positivo (sin signo)',
  })
  amount!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  profitCenterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de cambio a moneda base',
    example: '3.75',
  })
  @IsOptional()
  @IsNumberString()
  fxRate?: string;

  @ApiPropertyOptional({
    description: 'Importe convertido a moneda base',
    example: '375.00',
  })
  @IsOptional()
  @IsNumberString()
  amountBase?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}

/** Cuerpo de `POST /accounting/journal-transactions` (UC-16-01). */
export class PostJournalDto {
  @ApiProperty({
    description: 'Práctica propietaria del asiento',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  @ApiPropertyOptional({
    description:
      'Número de asiento (único por práctica); autogenerado si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  transactionNumber?: string;

  @ApiProperty({
    description: 'Fecha contable',
    format: 'date',
    example: '2026-01-31',
  })
  @IsDateString()
  transactionDate!: string;

  @ApiPropertyOptional({
    description: 'Periodo fiscal ABIERTO',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

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

/** Cuerpo de `POST /accounting/journal-transactions/:id/reverse` (UC-16-03). */
export class ReverseJournalDto {
  @ApiPropertyOptional({
    description: 'Periodo fiscal ABIERTO de la reversa',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fiscalPeriodId?: string;

  @ApiPropertyOptional({ description: 'Motivo de la reversa', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /accounting/postings/determine-accounts` (UC-16-02). */
export class DetermineAccountsDto {
  @ApiProperty({ description: 'Tenant al que aplica la regla', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Escenario de posteo', format: 'uuid' })
  @IsUUID()
  postingScenarioConceptId!: string;

  @ApiPropertyOptional({ description: 'Rol de cuenta buscado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  accountRoleConceptId?: string;
}

/** Cuerpo de `POST /accounting/journal-transactions/:id/files` (UC-16-13). */
export class AttachFileDto {
  @ApiProperty({
    description: 'Archivo ya cargado en object storage',
    format: 'uuid',
  })
  @IsUUID()
  fileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;
}

/** Respuesta con el asiento posteado. */
export class JournalTransactionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() transactionNumber!: string;
  @ApiProperty() status!: string;
  @ApiProperty() totalAmount!: string;
  @ApiProperty({ type: Number }) lineCount!: number;
  @ApiProperty() postedAt!: Date | null;
}

/** Respuesta de la determinación de cuentas. */
export class DeterminedAccountResponseDto {
  @ApiProperty({ format: 'uuid' }) ruleId!: string;
  @ApiProperty({ format: 'uuid' }) targetAccountId!: string;
  @ApiProperty({ type: Number, nullable: true }) priority!: number | null;
}

/** Respuesta genérica de estado. */
export class AccountingStatusDto {
  @ApiProperty({ example: true }) ok!: boolean;
  @ApiPropertyOptional({ format: 'uuid' }) id?: string;
}
