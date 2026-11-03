import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export const AFFILIATION_INVITATION_KINDS = [
  'PRACTITIONER',
  'SUPPORT_STAFF',
] as const;
export type AffiliationInvitationKind =
  (typeof AFFILIATION_INVITATION_KINDS)[number];

/** `POST /org/affiliation-invitations`. */
export class CreateAffiliationInvitationDto {
  @ApiProperty({ enum: AFFILIATION_INVITATION_KINDS })
  @IsIn(AFFILIATION_INVITATION_KINDS)
  kind!: AffiliationInvitationKind;

  /** A specific person: the code is then single-use and only that person can redeem it. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetPersonId?: string;

  @ApiProperty({ minimum: 1, maximum: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  maxUses!: number;

  @ApiProperty({ minimum: 1, maximum: 90 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  expiresInDays!: number;

  /** Accepted for client compatibility; support requests always use the SECRETARY template. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleTemplateCode?: string;
}

/** `POST /affiliation-invitations/redeem`. The code is base64url and case-sensitive. */
export class RedeemAffiliationInvitationDto {
  @ApiProperty({ minLength: 8, maxLength: 200 })
  @IsString()
  @Length(8, 200)
  code!: string;
}

export type AffiliationInvitationStatus =
  'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'REVOKED';

export interface AffiliationInvitationViewDto {
  id: string;
  kind: AffiliationInvitationKind;
  targetPersonId?: string;
  maxUses: number;
  usesCount: number;
  expiresAt: Date;
  status: AffiliationInvitationStatus;
  createdAt: Date;
  /** Plain code: only present in the creation response (the API stores its hash). */
  code?: string;
}

export interface ListAffiliationInvitationsResponseDto {
  items: AffiliationInvitationViewDto[];
}

/** A redemption leaves a request that the organization decides (unless it was already approved). */
export interface AffiliationRedeemResultDto {
  kind: AffiliationInvitationKind;
  tenantId: string;
  organizationName?: string;
  pendingApproval: boolean;
  /** Practitioner: the pending affiliation (`profiles.practitioner_affiliations`). */
  roleAssignmentId?: string;
  /** Support staff: the pending support link. */
  requestId?: string;
}
