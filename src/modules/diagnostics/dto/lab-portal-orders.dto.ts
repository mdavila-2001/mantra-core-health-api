import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  LAB_ORDER_ACTIONS,
  type LabOrderAction,
  type LabOrderStatus,
} from '../services/lab-portal.projection';

const STATUSES: readonly LabOrderStatus[] = [
  'DRAFT',
  'RECEIVED',
  'PROCESSED',
  'UPLOADED',
  'CANCELLED',
  'REJECTED',
];

/** Body of `POST /diagnostics/lab/orders/:orderId/transitions`. */
export class LabOrderTransitionDto {
  @ApiProperty({ enum: LAB_ORDER_ACTIONS })
  @IsIn(LAB_ORDER_ACTIONS)
  action!: LabOrderAction;

  /** Why the order is rejected (kept with the specimen rejection). */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

/** A result already uploaded for the order, just enough to download it. */
export class LabOrderFileDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() sizeBytes!: number;
}

/** One order of the performer tenant with its derived state. */
export class LabOrderDto {
  @ApiProperty({ format: 'uuid' }) orderId!: string;
  @ApiProperty() studyName!: string;
  @ApiProperty() patientName!: string;
  @ApiProperty() requesterName!: string;
  @ApiProperty({ format: 'date-time' }) requestedAt!: string;
  @ApiProperty({ enum: STATUSES }) status!: LabOrderStatus;
  @ApiProperty({ type: String, nullable: true }) reason!: string | null;
  @ApiProperty({ type: [LabOrderFileDto] }) files!: LabOrderFileDto[];
}

export class LabOrderPageDto {
  @ApiProperty({ type: [LabOrderDto] }) items!: LabOrderDto[];
  @ApiProperty() count!: number;
}

/** An order a result can be attached to (PROCESSED or UPLOADED). */
export class LabResultTargetDto {
  @ApiProperty({ format: 'uuid' }) orderId!: string;
  @ApiProperty() studyName!: string;
  @ApiProperty() patientName!: string;
  @ApiProperty() requesterName!: string;
  @ApiProperty({ format: 'date-time' }) requestedAt!: string;
  @ApiProperty() fileCount!: number;
}

export class LabResultTargetPageDto {
  @ApiProperty({ type: [LabResultTargetDto] }) items!: LabResultTargetDto[];
  @ApiProperty() count!: number;
}
