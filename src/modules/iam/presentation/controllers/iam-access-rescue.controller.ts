import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { IpAccessRulesService } from '../../application/services/ip-access-rules.service';
import { SessionPoliciesService } from '../../application/services/session-policies.service';
import { AccessRescueResultDto } from '../dto/access-rescue.dto';

/**
 * Rescate de una organización que se encerró (o la encerraron) con sus propias
 * reglas: solo la plataforma (`SYSTEM`) borra las reglas de red y las políticas
 * de sesión de un tenant. Cada ejecución deja su propio asiento de auditoría con
 * el tenant; las filas quedan como histórico (estado retirado), no se borran.
 */
@ApiTags('iam-session-policies')
@ApiBearerAuth()
@Roles('SYSTEM')
@Controller('iam/rescue/tenants/:tenantId')
export class IamAccessRescueController {
  /**
   * @param ipRules - Reglas de red.
   * @param sessionPolicies - Políticas de sesión.
   */
  constructor(
    private readonly ipRules: IpAccessRulesService,
    private readonly sessionPolicies: SessionPoliciesService,
  ) {}

  /** Retira las reglas de red de la organización. */
  @Audited({
    action: 'IP_ACCESS_RULES_RESCUED',
    entity: 'ip_access_rule',
    entityId: 'param:tenantId',
  })
  @Delete('ip-access-rules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rescate (SYSTEM): retirar las reglas de red de una organización',
  })
  async clearIpAccessRules(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessRescueResultDto> {
    return { retired: await this.ipRules.clearForTenant(tenantId, actor.id) };
  }

  /** Retira las políticas de sesión de la organización. */
  @Audited({
    action: 'SESSION_POLICIES_RESCUED',
    entity: 'session_policy',
    entityId: 'param:tenantId',
  })
  @Delete('session-policies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Rescate (SYSTEM): retirar las políticas de sesión de una organización',
  })
  async clearSessionPolicies(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessRescueResultDto> {
    return {
      retired: await this.sessionPolicies.clearForTenant(tenantId, actor.id),
    };
  }
}
