import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import { MembershipInvitationsService } from '../services/membership-invitations.service';
import {
  MembershipInvitationDecisionDto,
  MembershipInvitationListDto,
} from '../dto/membership-invitation.dto';

/**
 * The caller's own organization invitations. Registered before
 * `TenantsController` so `me` is never captured by `:tenantId`.
 *
 * `@TenantAgnostic`: a person with only pending invitations belongs to no
 * tenant yet. `@Roles()` empty: the subject comes from the session and the
 * service filters every row by it, so there is nobody else to point at.
 */
@ApiTags('directory-tenants')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('tenants/me/membership-invitations')
export class MembershipInvitationsController {
  constructor(private readonly invitations: MembershipInvitationsService) {}

  @Get()
  @Roles()
  @ApiOperation({ summary: 'Pending organization invitations of the caller' })
  @ApiOkResponse({ type: MembershipInvitationListDto })
  list(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MembershipInvitationListDto> {
    return this.invitations.list(actor);
  }

  @Audited({
    action: 'TENANT_MEMBERSHIP_ACCEPTED',
    entity: 'tenant_membership',
    entityId: 'param:membershipId',
  })
  @Post(':membershipId/accept')
  @Roles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept an invitation: the membership turns active',
  })
  @ApiOkResponse({ type: MembershipInvitationDecisionDto })
  accept(
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MembershipInvitationDecisionDto> {
    return this.invitations.accept(membershipId, actor);
  }

  @Audited({
    action: 'TENANT_MEMBERSHIP_DECLINED',
    entity: 'tenant_membership',
    entityId: 'param:membershipId',
  })
  @Post(':membershipId/decline')
  @Roles()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline an invitation: the membership ends' })
  @ApiOkResponse({ type: MembershipInvitationDecisionDto })
  decline(
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MembershipInvitationDecisionDto> {
    return this.invitations.decline(membershipId, actor);
  }
}
