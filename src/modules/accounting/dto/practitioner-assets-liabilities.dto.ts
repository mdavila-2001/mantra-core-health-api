import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * FT-26 — auto-servicio de activos y pasivos del doctor.
 *
 * Cuerpos y respuestas de `AccountingPractitionerController` para las nuevas
 * rutas de activos y pasivos. Reutiliza `CapitalizeAssetDto` y
 * `RunDepreciationDto` tal cual para dar de alta un activo y para registrar
 * su avance — son el mismo contrato que ya usa `SECURITY_ADMIN`, sin
 * duplicarlo — y sólo agrega lo que ese contrato no cubre: listar, prender o
 * apagar la automatización, y el alta y el avance de un pasivo (que no tenían
 * ningún endpoint todavía, ni siquiera para `SECURITY_ADMIN`).
 */

/** Cuerpo de `PATCH .../assets/:id/automation` y `.../liabilities/:id/automation`. */
export class SetAutomationDto {
  @ApiProperty({ description: 'Si un proceso automático puede avanzarlo solo' })
  @IsBoolean()
  automated!: boolean;
}

/** Una fila del activo o del pasivo, tal como los lista el auto-servicio. */
export class AssetSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  statusConceptId!: string;

  @ApiPropertyOptional({ example: '8500.00' })
  bookValue?: string;

  @ApiPropertyOptional({ example: '10000.00' })
  acquisitionCost?: string;

  @ApiProperty()
  automated!: boolean;
}

export class LiabilitySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  creditorName?: string;

  @ApiPropertyOptional({ example: '5000.00' })
  principalAmount?: string;

  @ApiPropertyOptional({ example: '3200.00' })
  outstandingAmount?: string;

  @ApiProperty()
  statusConceptId!: string;

  @ApiProperty()
  automated!: boolean;
}

/** Cuerpo de `POST /accounting/practitioner/liabilities`. */
export class CreateOwnLiabilityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ description: 'Código del pasivo', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ description: 'Nombre del pasivo', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  creditorName?: string;

  @ApiProperty({ description: 'Cuenta contable del pasivo', format: 'uuid' })
  @IsUUID()
  accountId!: string;

  @ApiProperty({ description: 'Monto del préstamo', example: '5000.00' })
  @IsNumberString()
  principalAmount!: string;

  @ApiPropertyOptional({
    description: 'Tasa de interés anual, en por ciento',
    example: '12.00',
  })
  @IsOptional()
  @IsNumberString()
  interestRate?: string;

  @ApiProperty({ description: 'Número de cuotas mensuales', example: 12 })
  @IsInt()
  @Min(1)
  @Max(360)
  installments!: number;

  @ApiProperty({ format: 'date', example: '2026-09-05' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    description:
      'Si un proceso automático puede pagar sus cuotas solo (por omisión, sí)',
  })
  @IsOptional()
  @IsBoolean()
  automated?: boolean;
}

/** Una cuota del cronograma, tal como la devuelve el alta y el listado de detalle. */
export class LiabilityScheduleDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  installmentNumber!: number;

  @ApiPropertyOptional({ format: 'date' })
  dueDate?: string;

  @ApiPropertyOptional({ example: '416.67' })
  principalDue?: string;

  @ApiPropertyOptional({ example: '12.00' })
  interestDue?: string;

  @ApiPropertyOptional({ example: '0.00' })
  paidAmount?: string;

  @ApiProperty()
  statusConceptId!: string;
}

/** Respuesta de `POST /accounting/practitioner/liabilities`. */
export class LiabilityCreatedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  schedule!: readonly LiabilityScheduleDto[];
}

/** Cuerpo de `POST /accounting/practitioner/assets/:id/progress`. */
export class RegisterAssetProgressDto {
  @ApiProperty({
    description: 'Cuenta de gasto por depreciación (débito)',
    format: 'uuid',
  })
  @IsUUID()
  depreciationExpenseAccountId!: string;

  @ApiProperty({
    description: 'Cuenta de depreciación acumulada (crédito)',
    format: 'uuid',
  })
  @IsUUID()
  accumulatedDepreciationAccountId!: string;

  @ApiPropertyOptional({
    description: 'Fecha del posteo; por omisión, hoy',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  postingDate?: string;
}

/** Cuerpo de `POST /accounting/practitioner/liabilities/:id/progress`. */
export class RegisterLiabilityProgressDto {
  @ApiProperty({
    description: 'Cuenta banco/tesorería (crédito)',
    format: 'uuid',
  })
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty({
    description: 'Cuenta de gasto por interés (débito)',
    format: 'uuid',
  })
  @IsUUID()
  interestExpenseAccountId!: string;
}

/** Respuesta común de "registrar avance". */
export class ProgressRegisteredResponseDto {
  @ApiProperty()
  transactionId!: string;

  @ApiPropertyOptional()
  installmentNumber?: number;

  @ApiProperty({ example: '416.67' })
  amount!: string;
}
