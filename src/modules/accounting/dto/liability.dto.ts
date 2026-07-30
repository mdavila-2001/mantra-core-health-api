import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/** Cuerpo de `POST /accounting/liabilities/:id/payments` (UC-16-12). */
export class PayLiabilityDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ description: 'Práctica del asiento generado', format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe total pagado (= principal + interés)',
    example: '1200.00',
  })
  @IsNumberString()
  amount!: string;

  /**
   * Valor de principal component mantenido por la instancia.
   */
  @ApiProperty({ description: 'Componente de principal', example: '1000.00' })
  @IsNumberString()
  principalComponent!: string;

  /**
   * Valor de interest component mantenido por la instancia.
   */
  @ApiProperty({ description: 'Componente de interés', example: '200.00' })
  @IsNumberString()
  interestComponent!: string;

  /**
   * Identificador asociado a bank account.
   */
  @ApiProperty({
    description: 'Cuenta banco/tesorería (crédito)',
    format: 'uuid',
  })
  @IsUUID()
  bankAccountId!: string;

  /**
   * Identificador asociado a interest expense account.
   */
  @ApiProperty({
    description: 'Cuenta de gasto por interés (débito)',
    format: 'uuid',
  })
  @IsUUID()
  interestExpenseAccountId!: string;

  /**
   * Identificador asociado a liability schedule.
   */
  @ApiPropertyOptional({
    description: 'Cuota (installment) a saldar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  liabilityScheduleId?: string;

  /**
   * Valor de paid at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date', example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

/** Respuesta con el pago de pasivo registrado. */
export class LiabilityPaymentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Identificador asociado a transaction.
   */
  @ApiProperty({ format: 'uuid' }) transactionId!: string;
  /**
   * Valor de liability status mantenido por la instancia.
   */
  @ApiProperty() liabilityStatus!: string;
  /**
   * Valor de outstanding amount mantenido por la instancia.
   */
  @ApiProperty() outstandingAmount!: string;
}
