import { ApiProperty } from '@nestjs/swagger';

/** Role an organization invites with; roles outside the DTO map read `OTHER`. */
export const INVITED_ROLE_CODES = ['OWNER', 'ADMIN', 'STAFF', 'OTHER'] as const;
export type InvitedRoleCode = (typeof INVITED_ROLE_CODES)[number];

/** A membership an organization created for the caller and not yet accepted. */
export class MembershipInvitationDto {
  @ApiProperty({ format: 'uuid', description: 'The pending membership' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  tenantName!: string;

  @ApiProperty({ enum: INVITED_ROLE_CODES })
  role!: InvitedRoleCode;

  @ApiProperty({ format: 'date-time' })
  invitedAt!: string;
}

/** `GET /tenants/me/membership-invitations`. */
export class MembershipInvitationListDto {
  @ApiProperty({ type: [MembershipInvitationDto] })
  items!: MembershipInvitationDto[];
}

/** Outcome of accepting or declining an invitation. */
export class MembershipInvitationDecisionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ enum: ['ACTIVE', 'DECLINED'] })
  status!: 'ACTIVE' | 'DECLINED';
}
