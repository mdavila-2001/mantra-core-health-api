import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /accounting/liabilities/:id/payments` (UC-16-12). */
export class PayLiabilityDto {
  @ApiProperty({ description: 'Práctica del asiento generado', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ description: 'Importe total pagado (= principal + interés)', example: '1200.00' })
  @IsNumberString()
  amount!: string;

  @ApiProperty({ description: 'Componente de principal', example: '1000.00' })
  @IsNumberString()
  principalComponent!: string;

  @ApiProperty({ description: 'Componente de interés', example: '200.00' })
  @IsNumberString()
  interestComponent!: string;

  @ApiProperty({ description: 'Cuenta banco/tesorería (crédito)', format: 'uuid' })
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty({ description: 'Cuenta de gasto por interés (débito)', format: 'uuid' })
  @IsUUID()
  interestExpenseAccountId!: string;

  @ApiPropertyOptional({ description: 'Cuota (installment) a saldar', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  liabilityScheduleId?: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

/** Respuesta con el pago de pasivo registrado. */
export class LiabilityPaymentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
  @ApiProperty() liabilityStatus!: string;
  @ApiProperty() outstandingAmount!: string;
}
