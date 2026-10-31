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
import { SessionPoliciesService } from '../../application/services/session-policies.service';
import {
  PutSessionPoliciesDto,
  SessionPoliciesResponseDto,
} from '../dto/session-policies.dto';

/** Políticas de sesión de la organización activa. */
@ApiTags('iam-session-policies')
@ApiBearerAuth()
@Controller('org/session-policies')
export class SessionPoliciesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Políticas de sesión.
   */
  constructor(private readonly service: SessionPoliciesService) {}

  /** Políticas vigentes de la organización. */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Políticas de sesión de la organización' })
  get(): Promise<SessionPoliciesResponseDto> {
    return this.service.get();
  }

  /** Reemplaza las políticas de la organización. */
  @Audited({ action: 'SESSION_POLICIES_REPLACED', entity: 'session_policy' })
  @Put()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Definir las políticas de sesión de la organización',
  })
  put(
    @Body() dto: PutSessionPoliciesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Ip() ip: string,
  ): Promise<SessionPoliciesResponseDto> {
    return this.service.put(dto, actor, ip);
  }
}
