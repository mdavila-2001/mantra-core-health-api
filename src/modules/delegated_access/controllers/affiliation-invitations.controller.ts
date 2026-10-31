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
import {
  Audited,
  CurrentUser,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import { AffiliationInvitationsService } from '../services';
import {
  AffiliationInvitationCreatedDto,
  AffiliationRedeemResultDto,
  CreateAffiliationInvitationDto,
  ListAffiliationInvitationsResponseDto,
  OperationResultDto,
  RedeemAffiliationInvitationDto,
} from '../dto';

/** Códigos y QR de afiliación para doctores y personal de apoyo. */
@ApiTags('delegated-access-affiliation-invitations')
@ApiBearerAuth()
@Controller()
export class AffiliationInvitationsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Invitaciones de afiliación.
   */
  constructor(private readonly service: AffiliationInvitationsService) {}

  /** La organización crea un código o QR. */
  @Audited({
    action: 'AFFILIATION_INVITATION_CREATED',
    entity: 'affiliation_invitation',
    entityId: 'result.id',
  })
  @Post('org/affiliation-invitations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un código o QR de afiliación' })
  create(
    @Body() dto: CreateAffiliationInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationInvitationCreatedDto> {
    return this.service.create(dto, actor);
  }

  /** La organización apaga un código filtrado o ya innecesario. */
  @Audited({
    action: 'AFFILIATION_INVITATION_REVOKED',
    entity: 'affiliation_invitation',
    entityId: 'param:id',
  })
  @Post('org/affiliation-invitations/:id/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar un código o QR de afiliación' })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.service.revoke(id, actor);
  }

  /** Invitaciones de la organización, sin sus códigos. */
  @Get('org/affiliation-invitations')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar las invitaciones de afiliación' })
  list(): Promise<ListAffiliationInvitationsResponseDto> {
    return this.service.list();
  }

  /**
   * La persona canjea un código. Sin tenant activo: todavía no pertenece a la
   * organización que la invita; el tenant sale de la invitación.
   */
  @Audited({
    action: 'AFFILIATION_INVITATION_REDEEMED',
    entity: 'affiliation_invitation',
    tenantId: 'result.tenantId',
  })
  @Post('affiliation-invitations/redeem')
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Canjear un código o QR de afiliación' })
  redeem(
    @Body() dto: RedeemAffiliationInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationRedeemResultDto> {
    return this.service.redeem(dto, actor);
  }
}
