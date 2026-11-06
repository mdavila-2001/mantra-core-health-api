import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
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

const REASON_REQUIRED: readonly LabOrderAction[] = ['CANCEL', 'REJECT'];
const REASON_MESSAGE = 'Cuente por qué para continuar.';

/** Body of `POST /diagnostics/lab/orders/:orderId/transitions`. */
export class LabOrderTransitionDto {
  @ApiProperty({ enum: LAB_ORDER_ACTIONS })
  @IsIn(LAB_ORDER_ACTIONS)
  action!: LabOrderAction;

  /**
   * Why the order is cancelled or rejected. Mandatory for `CANCEL` and
   * `REJECT`, on any order (imaging included); kept in the performer's event
   * row and, for a rejection, with each specimen rejection.
   */
  @ApiPropertyOptional({
    maxLength: 1000,
    description:
      'Required (non-blank) when action is CANCEL or REJECT; ignored by RECEIVE and PROCESS',
  })
  @ValidateIf(
    (body: LabOrderTransitionDto) =>
      REASON_REQUIRED.includes(body.action) || body.reason !== undefined,
  )
  @IsString({ message: REASON_MESSAGE })
  @Matches(/\S/, { message: REASON_MESSAGE })
  @MaxLength(1000)
  reason?: string;
}

/** A result already uploaded for the order, just enough to download it. */
export class LabOrderFileDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() sizeBytes!: number;
}

/** Where the written report of the order stands for this tenant. */
export class LabOrderReportStateDto {
  @ApiProperty({
    enum: ['DRAFT', 'PUBLISHED'],
    nullable: true,
    description: 'Null when the tenant never opened a written report.',
  })
  draftStatus!: 'DRAFT' | 'PUBLISHED' | null;
  @ApiPropertyOptional({ format: 'uuid' }) publishedVersionId?: string;
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
  @ApiProperty({
    description:
      'Whether REJECT applies now: a received order with an open specimen.',
  })
  canReject!: boolean;
  @ApiProperty({ type: [LabOrderFileDto] }) files!: LabOrderFileDto[];
  @ApiProperty({ type: LabOrderReportStateDto })
  report!: LabOrderReportStateDto;
}

/** Query of `GET /diagnostics/lab/orders`. */
export class LabOrderListQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 500, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  /** Opaque `nextCursor` of the previous page. */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;
}

export class LabOrderPageDto {
  @ApiProperty({ type: [LabOrderDto] }) items!: LabOrderDto[];
  /** Orders of the laboratory in total, not just the ones in this page. */
  @ApiProperty() count!: number;
  /** Present when older orders remain: send it back as `cursor`. */
  @ApiPropertyOptional() nextCursor?: string;
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
