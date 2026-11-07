import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  CreateAffiliationInvitationDto,
  RedeemAffiliationInvitationDto,
  type AffiliationInvitationViewDto,
  type AffiliationRedeemResultDto,
  type ListAffiliationInvitationsResponseDto,
} from '../dto/affiliation-invitation.dto';
import { AffiliationInvitationsService } from '../services/affiliation-invitations.service';
import { RedeemAffiliationInvitationService } from '../services/redeem-affiliation-invitation.service';

/**
 * Affiliation codes and QR: the organization issues them; a practitioner or a support staff member
 * redeems one and leaves a pending request for the organization to decide.
 */
@ApiTags('delegated-access-affiliation-invitations')
@ApiBearerAuth()
@Controller()
export class AffiliationInvitationsController {
  constructor(
    private readonly invitations: AffiliationInvitationsService,
    private readonly redemption: RedeemAffiliationInvitationService,
  ) {}

  /** Organization admin issues a code. The plain code is returned only here. */
  @Audited({
    action: 'AFFILIATION_INVITATION_CREATED',
    entity: 'affiliation_invitation',
    entityId: 'result.id',
  })
  @Post('org/affiliation-invitations')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un código o QR de afiliación' })
  create(
    @Body() dto: CreateAffiliationInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationInvitationViewDto> {
    return this.invitations.create(requireTenantId(), dto, actor);
  }

  /**
   * Organization admin turns a code off. Authorization is the OWNER/ADMIN check of the
   * service (as in create and list): there is no global role to gate it with.
   */
  @Audited({
    action: 'AFFILIATION_INVITATION_REVOKED',
    entity: 'affiliation_invitation',
    entityId: 'param:id',
  })
  @Post('org/affiliation-invitations/:id/revoke')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar un código o QR de afiliación' })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationInvitationViewDto> {
    return this.invitations.revoke(requireTenantId(), id, actor);
  }

  /** Codes of the active organization, without the plain codes. */
  @Get('org/affiliation-invitations')
  @ApiOperation({
    summary: 'Listar los códigos de afiliación de la organización',
  })
  list(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListAffiliationInvitationsResponseDto> {
    return this.invitations.list(requireTenantId(), actor);
  }

  /** No active tenant: the person does not belong to the inviting organization yet. */
  @Audited({
    action: 'AFFILIATION_INVITATION_REDEEMED',
    entity: 'affiliation_invitation',
  })
  @Post('affiliation-invitations/redeem')
  @TenantAgnostic()
  @Roles('PRACTITIONER', 'SUPPORT_STAFF')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Canjear un código o QR de afiliación' })
  redeem(
    @Body() dto: RedeemAffiliationInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationRedeemResultDto> {
    return this.redemption.redeem(dto, actor);
  }
}
