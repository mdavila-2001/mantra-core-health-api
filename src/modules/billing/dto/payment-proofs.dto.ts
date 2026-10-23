import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /billing/me/charges/:chargeId/payment-proofs` (C-01). */
export class CreatePaymentProofDto {
  @ApiProperty({
    enum: ['QR_TRANSFER', 'CASH'],
    description:
      'QR_TRANSFER: transferencia contra el QR bancario de la sede (exige fileId). CASH: pagó en efectivo en el consultorio.',
  })
  @IsIn(['QR_TRANSFER', 'CASH'])
  method!: 'QR_TRANSFER' | 'CASH';

  @ApiPropertyOptional({
    description:
      'Archivo ya subido por el paciente con POST /common/files/upload (la captura del comprobante)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiProperty({
    description: 'Monto declarado, en centavos (unidades menores)',
    example: 15000,
  })
  @IsInt()
  @Min(1)
  amountMinor!: number;
}

/** Cuerpo de `POST /billing/payment-proofs/:id/reject`. */
export class RejectPaymentProofDto {
  @ApiProperty({ description: 'Motivo que verá el paciente', minLength: 3 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

/** Filtros de `GET /billing/me/provider-payment-table`. */
export class ProviderPaymentTableQueryDto {
  @ApiPropertyOptional({ description: 'Desde (inclusive), ISO 8601' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta (exclusive), ISO 8601' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Sólo las sesiones de esta persona (la caja «Pagos» de la consulta)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ description: 'Cursor opaco de la página anterior' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
