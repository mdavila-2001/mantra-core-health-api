import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Una línea planificada del cronograma de devengo (una por periodo). */
export class AccrualScheduleInputDto {
  /**
   * Identificador asociado a fiscal period.
   */
  @ApiProperty({ description: 'Periodo fiscal de la línea', format: 'uuid' })
  @IsUUID()
  fiscalPeriodId!: string;

  /**
   * Valor de planned amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe planificado del periodo',
    example: '100.00',
  })
  @IsNumberString()
  plannedAmount!: string;
}

/** Cuerpo de `POST /accounting/accrual-objects` (UC-16-06). */
export class CreateAccrualObjectDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de object number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de objeto (único por tenant)',
    maxLength: 60,
  })
  @IsString()
  @MaxLength(60)
  objectNumber!: string;

  /**
   * Identificador asociado a expense account.
   */
  @ApiProperty({ description: 'Cuenta de gasto postable', format: 'uuid' })
  @IsUUID()
  expenseAccountId!: string;

  /**
   * Identificador asociado a accrual account.
   */
  @ApiProperty({ description: 'Cuenta de devengo postable', format: 'uuid' })
  @IsUUID()
  accrualAccountId!: string;

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
   * Valor de start date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe total (= suma de planned)',
    example: '300.00',
  })
  @IsNumberString()
  totalAmount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de schedule mantenido por la instancia.
   */
  @ApiProperty({
    type: [AccrualScheduleInputDto],
    description: 'Cronograma (>=1 línea)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AccrualScheduleInputDto)
  schedule!: AccrualScheduleInputDto[];
}

/** Cuerpo de `POST /accounting/accruals/run` (UC-16-07). */
export class RunAccrualsDto {
  /**
   * Identificador asociado a accrual object.
   */
  @ApiProperty({ description: 'Objeto de devengo a correr', format: 'uuid' })
  @IsUUID()
  accrualObjectId!: string;

  /**
   * Identificador asociado a fiscal period.
   */
  @ApiProperty({
    description: 'Periodo fiscal ABIERTO a devengar',
    format: 'uuid',
  })
  @IsUUID()
  fiscalPeriodId!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica del asiento generado', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de posting date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  postingDate!: string;
}

/** Respuesta con el objeto de devengo y su cronograma. */
export class AccrualObjectResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de object number mantenido por la instancia.
   */
  @ApiProperty() objectNumber!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de schedule line ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String] }) scheduleLineIds!: string[];
}

/** Respuesta del batch de devengo. */
export class AccrualRunResponseDto {
  /**
   * Valor de posted lines mantenido por la instancia.
   */
  @ApiProperty({ type: Number }) postedLines!: number;
  /**
   * Valor de transaction ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    description: 'Transacciones de devengo generadas',
  })
  transactionIds!: string[];
}
