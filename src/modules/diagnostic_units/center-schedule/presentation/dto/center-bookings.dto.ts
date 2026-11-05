import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

/** Query of `GET /diagnostic-units/me/bookings`. */
export class CenterBookingsQueryDto {
  @ApiProperty({ example: '2026-11-04T04:00:00.000Z' })
  @IsISO8601()
  from!: string;

  @ApiProperty({ example: '2026-11-05T04:00:00.000Z' })
  @IsISO8601()
  to!: string;
}

export class CenterBookingDto {
  @ApiProperty({ format: 'uuid' }) bookingId!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: '`null` for a booking made outside the order flow.',
  })
  orderId!: string | null;
  @ApiProperty({ type: String, nullable: true }) patientName!: string | null;
  @ApiProperty({ type: String, nullable: true }) studyName!: string | null;
  @ApiProperty() startsAt!: string;
  @ApiProperty() endsAt!: string;
  @ApiProperty({ type: String, nullable: true }) siteName!: string | null;
  @ApiProperty({
    enum: [
      'REQUESTED',
      'PENDING_CONFIRMATION',
      'CONFIRMED',
      'CHECKED_IN',
      'IN_PROGRESS',
      'COMPLETED',
    ],
  })
  status!: string;
}

/** Response of `GET /diagnostic-units/me/bookings`. */
export class CenterBookingsDto {
  @ApiProperty({ type: [CenterBookingDto] }) items!: CenterBookingDto[];
  @ApiProperty() count!: number;
}
