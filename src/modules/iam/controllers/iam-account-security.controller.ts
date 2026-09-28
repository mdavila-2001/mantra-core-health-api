import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import { IamAccountSecurityService } from '../services';
import {
  ChangePasswordDto,
  ChangePasswordResultDto,
  MySessionDto,
  RevokeMySessionResultDto,
} from '../dto';

/**
 * Seguridad de la propia cuenta (ID-24): cambiar la contraseña y administrar las
 * sesiones abiertas. Sin `@Roles`: cualquier sesión autenticada opera sobre lo
 * suyo, y la titularidad se resuelve por el `id` del token en el servicio.
 * `@TenantAgnostic` porque no toca datos de ningún tenant.
 */
@ApiTags('iam-auth')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('iam')
export class IamAccountSecurityController {
  /**
   * @param service - Seguridad de la cuenta.
   */
  constructor(private readonly service: IamAccountSecurityService) {}

  /** Cambia la contraseña y cierra las otras sesiones. */
  @Post('auth/change-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar la contraseña de la propia cuenta' })
  changePassword(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Ip() ip: string,
  ): Promise<ChangePasswordResultDto> {
    return this.service.changePassword(actor, dto, ip);
  }

  /** Sesiones abiertas de la propia cuenta. */
  @Get('me/sessions')
  @ApiOperation({ summary: 'Listar mis sesiones abiertas' })
  listSessions(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MySessionDto[]> {
    return this.service.listSessions(actor);
  }

  /** Cierra una sesión propia. */
  @Post('me/sessions/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar una de mis sesiones' })
  revokeSession(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RevokeMySessionResultDto> {
    return this.service.revokeSession(actor, id);
  }
}
