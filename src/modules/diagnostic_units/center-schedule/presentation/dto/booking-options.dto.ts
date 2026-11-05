import { ApiProperty } from '@nestjs/swagger';
import {
  MODALITY_CODES,
  type ModalityCode,
} from '../../domain/center-schedule.model';

/** A center that can perform the order's study. */
export class OrderBookingOptionDto {
  @ApiProperty({ format: 'uuid' }) unitId!: string;
  @ApiProperty() unitName!: string;
  @ApiProperty({ type: String, nullable: true }) addressText!: string | null;
  @ApiProperty({ type: Number, nullable: true }) price!: number | null;
  @ApiProperty({ type: String, nullable: true }) currency!: string | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Straight line from the patient home; `null` if a location is missing.',
  })
  distanceKm!: number | null;
  @ApiProperty({ type: String, nullable: true }) nextStartAt!: string | null;
  @ApiProperty({ type: String, nullable: true }) preparation!: string | null;
  @ApiProperty({ description: 'Patients per slot for the modality.' })
  operationalEquipment!: number;
}

/** Response of `GET /diagnostic-results/me/orders/{orderId}/booking-options`. */
export class OrderBookingOptionsDto {
  @ApiProperty({ format: 'uuid' }) orderId!: string;
  @ApiProperty() studyCode!: string;
  @ApiProperty() studyName!: string;
  @ApiProperty({ enum: MODALITY_CODES }) modalityCode!: ModalityCode;
  @ApiProperty() modalityLabel!: string;
  @ApiProperty({ type: [OrderBookingOptionDto] })
  options!: OrderBookingOptionDto[];
}
