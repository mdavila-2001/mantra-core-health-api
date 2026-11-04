import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Kind of access request: primary care, granular by specialty, or care of a visit. */
export const ACCESS_REQUEST_KINDS = [
  'CABECERA',
  'GRANULAR',
  'ATENCION',
] as const;
export type AccessRequestKind = (typeof ACCESS_REQUEST_KINDS)[number];

/** Whether the viewer received the request or sent it. */
export const ACCESS_REQUEST_DIRECTIONS = ['RECEIVED', 'SENT'] as const;
export type AccessRequestDirection = (typeof ACCESS_REQUEST_DIRECTIONS)[number];

/** Status of an access request, common to the two circuits that feed the inbox. */
export const ACCESS_REQUEST_STATUSES = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'REVOKED',
  'EXPIRED',
] as const;
export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];

/** The other party of a request, as the viewer sees it. */
export class AccessRequestCounterpartDto {
  /** Profile of the other party; absent if the account has no linked person. */
  @ApiPropertyOptional({ format: 'uuid' })
  profileId?: string;

  /** Name to display; absent if the person has no name loaded. */
  @ApiPropertyOptional()
  displayName?: string;
}

/** One entry of the unified access-request inbox. */
export class AccessRequestItemDto {
  /** Id of the row; which table it belongs to depends on `kind`. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Primary care, granular by specialty, or care of a visit. */
  @ApiProperty({ enum: ACCESS_REQUEST_KINDS })
  kind!: AccessRequestKind;

  /** `RECEIVED` if the viewer must answer it, `SENT` if the viewer asked. */
  @ApiProperty({ enum: ACCESS_REQUEST_DIRECTIONS })
  direction!: AccessRequestDirection;

  /** The other party. */
  @ApiProperty({ type: AccessRequestCounterpartDto })
  counterpart!: AccessRequestCounterpartDto;

  /** When it was asked. */
  @ApiProperty({ type: String, format: 'date-time' })
  requestedAt!: Date;

  /** When it was answered; null while pending. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  decidedAt!: Date | null;

  /** Current status, with the validity already considered. */
  @ApiProperty({ enum: ACCESS_REQUEST_STATUSES })
  status!: AccessRequestStatus;

  /** Specialties asked for (granular only; empty otherwise). */
  @ApiProperty({ type: [String] })
  requestedSpecialtyConceptIds!: string[];

  /** Specialties the patient authorized (granular only; empty otherwise). */
  @ApiProperty({ type: [String] })
  authorizedSpecialtyConceptIds!: string[];
}
