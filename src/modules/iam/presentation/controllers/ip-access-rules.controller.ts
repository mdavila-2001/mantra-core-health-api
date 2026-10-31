import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { IpAccessRulesService } from '../../application/services/ip-access-rules.service';
import {
  IpAccessRulesResponseDto,
  PutIpAccessRulesDto,
} from '../dto/ip-access-rules.dto';

/**
 * Redes desde las que puede entrar el personal de la organización. Solo rigen
 * si la política de sesión tiene `enforceIpRules` (`/org/session-policies`).
 */
@ApiTags('iam-session-policies')
@ApiBearerAuth()
@Controller('org/ip-access-rules')
export class IpAccessRulesController {
  /**
   * @param service - Reglas de red de la organización.
   */
  constructor(private readonly service: IpAccessRulesService) {}

  /** Reglas de red vigentes de la organización. */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Reglas de red de la organización' })
  get(): Promise<IpAccessRulesResponseDto> {
    return this.service.list();
  }

  /** Reemplaza las reglas de red de la organización. */
  @Audited({ action: 'IP_ACCESS_RULES_REPLACED', entity: 'ip_access_rule' })
  @Put()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Definir las reglas de red de la organización' })
  put(
    @Body() dto: PutIpAccessRulesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Ip() ip: string,
  ): Promise<IpAccessRulesResponseDto> {
    return this.service.put(dto, actor, ip);
  }
}
