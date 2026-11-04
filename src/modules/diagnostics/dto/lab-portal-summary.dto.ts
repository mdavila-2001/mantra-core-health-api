import { ApiProperty } from '@nestjs/swagger';

export const LAB_ACTIVITY_KINDS = [
  'SERVICE_CREATED',
  'SERVICE_UPDATED',
  'SERVICE_WITHDRAWN',
  'SERVICES_IMPORTED',
  'RESULT_UPLOADED',
  'RESULT_WITHDRAWN',
] as const;
export type LabActivityKind = (typeof LAB_ACTIVITY_KINDS)[number];

export class LabActivityEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: 'date-time' }) at!: string;
  @ApiProperty({ enum: LAB_ACTIVITY_KINDS }) kind!: LabActivityKind;
  @ApiProperty() text!: string;
}

export class LabCategoryCountDto {
  @ApiProperty() category!: string;
  @ApiProperty() count!: number;
}

/** `GET /diagnostics/lab/summary`. */
export class LabSummaryDto {
  @ApiProperty() labName!: string;
  @ApiProperty() published!: number;
  @ApiProperty() drafts!: number;
  @ApiProperty() withdrawn!: number;
  @ApiProperty() unavailable!: number;
  @ApiProperty() ordersWithoutResults!: number;
  @ApiProperty() resultFiles!: number;
  @ApiProperty() resultBytes!: number;
  @ApiProperty({ type: [LabCategoryCountDto] })
  byCategory!: LabCategoryCountDto[];
  @ApiProperty({ type: [LabActivityEntryDto] })
  recentActivity!: LabActivityEntryDto[];
}
