import { ApiProperty } from '@nestjs/swagger';

/** Por qué un pago no llegó a facturación (CONTRATO §1, S-2 y S-5). */
export const BOOKING_BILLING_REASONS = [
  'NO_PRACTICE',
  'NO_PRICE',
  'NO_AMOUNT',
] as const;
export type BookingBillingReason = (typeof BOOKING_BILLING_REASONS)[number];

/**
 * El vínculo de una cita con facturación (FAC-01, `BookingBillingLink` del
 * contrato). `linked=false` dice por qué no hay cuenta por cobrar; el estado de
 * pago se guarda igual.
 */
export class BookingBillingLinkDto {
  @ApiProperty()
  linked!: boolean;

  /** La cuenta por cobrar de la cita (`appointment_payment_states.invoice_id`). */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  invoiceId!: string | null;

  /** Lo facturado: el precio de S-4. */
  @ApiProperty({ nullable: true, type: Number, example: 150 })
  amountBilled!: number | null;

  /** La suma de lo recibido por esta cita. */
  @ApiProperty({ nullable: true, type: Number, example: 150 })
  amountPaid!: number | null;

  @ApiProperty({ nullable: true, enum: ['BOB'] })
  currencyCode!: 'BOB' | null;

  /** Solo cuando `linked=false`. */
  @ApiProperty({ nullable: true, enum: BOOKING_BILLING_REASONS })
  reason!: BookingBillingReason | null;
}
