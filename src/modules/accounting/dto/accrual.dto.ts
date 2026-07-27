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
  @ApiProperty({ description: 'Periodo fiscal de la línea', format: 'uuid' })
  @IsUUID()
  fiscalPeriodId!: string;

  @ApiProperty({
    description: 'Importe planificado del periodo',
    example: '100.00',
  })
  @IsNumberString()
  plannedAmount!: string;
}

/** Cuerpo de `POST /accounting/accrual-objects` (UC-16-06). */
export class CreateAccrualObjectDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Número de objeto (único por tenant)',
    maxLength: 60,
  })
  @IsString()
  @MaxLength(60)
  objectNumber!: string;

  @ApiProperty({ description: 'Cuenta de gasto postable', format: 'uuid' })
  @IsUUID()
  expenseAccountId!: string;

  @ApiProperty({ description: 'Cuenta de devengo postable', format: 'uuid' })
  @IsUUID()
  accrualAccountId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  profitCenterId?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Importe total (= suma de planned)',
    example: '300.00',
  })
  @IsNumberString()
  totalAmount!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

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
  @ApiProperty({ description: 'Objeto de devengo a correr', format: 'uuid' })
  @IsUUID()
  accrualObjectId!: string;

  @ApiProperty({
    description: 'Periodo fiscal ABIERTO a devengar',
    format: 'uuid',
  })
  @IsUUID()
  fiscalPeriodId!: string;

  @ApiProperty({ description: 'Práctica del asiento generado', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  postingDate!: string;
}

/** Respuesta con el objeto de devengo y su cronograma. */
export class AccrualObjectResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() objectNumber!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: [String] }) scheduleLineIds!: string[];
}

/** Respuesta del batch de devengo. */
export class AccrualRunResponseDto {
  @ApiProperty({ type: Number }) postedLines!: number;
  @ApiProperty({
    type: [String],
    description: 'Transacciones de devengo generadas',
  })
  transactionIds!: string[];
}
