import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

/** Body of `POST /diagnostic-results/me/orders/{orderId}/booking`. */
export class BookOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  unitId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'The site (branch) chosen; absent, the main site.',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiProperty({ example: '2026-11-05T12:00:00.000Z' })
  @IsISO8601()
  startAt!: string;
}

/** The booked appointment of an order. */
export class OrderAppointmentDto {
  @ApiProperty({ format: 'uuid' }) bookingId!: string;
  @ApiProperty({ format: 'uuid' }) unitId!: string;
  @ApiProperty() unitName!: string;
  @ApiProperty({ type: String, nullable: true }) addressText!: string | null;
  @ApiProperty() startAt!: string;
  @ApiProperty() endAt!: string;
  @ApiProperty() studyName!: string;
  @ApiProperty({ type: Number, nullable: true }) price!: number | null;
  @ApiProperty({ type: String, nullable: true }) currency!: string | null;
  @ApiProperty({ type: String, nullable: true }) preparation!: string | null;
}
