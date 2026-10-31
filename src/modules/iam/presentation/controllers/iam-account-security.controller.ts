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
  Audited,
  CurrentUser,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../../common';
import {
  IamAccountSecurityService,
  IamMyMfaService,
  IpAccessRulesService,
} from '../../application/services';
import {
  ChangePasswordDto,
  ChangePasswordResultDto,
  ConfirmDeviceDto,
  ConfirmDeviceResultDto,
  ConfirmMyTotpDto,
  ConfirmMyTotpResultDto,
  MfaFactorResponseDto,
  MyMfaStatusDto,
  MyNetworkDto,
  MySessionDto,
  ReportDeviceNotMeResultDto,
  RequestDeviceCodeResultDto,
  RevokeMyMfaDto,
  RevokeMyMfaResultDto,
  RevokeMySessionResultDto,
  StartMyTotpDto,
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
   * @param myMfa - Segundo paso de la propia cuenta.
   * @param ipRules - Reglas de red (la IP que ve el servidor).
   */
  constructor(
    private readonly service: IamAccountSecurityService,
    private readonly myMfa: IamMyMfaService,
    private readonly ipRules: IpAccessRulesService,
  ) {}

  /**
   * La IP que ve el servidor para esta petición: es contra la que se evalúan las
   * reglas de red. Se muestra ANTES de guardar reglas, para no escribirlas con
   * una red que el servidor no ve (típico detrás de un proxy mal configurado).
   */
  @Get('me/network')
  @ApiOperation({ summary: 'La IP con la que me ve el servidor' })
  myNetwork(@Ip() ip: string): MyNetworkDto {
    return this.ipRules.describeOrigin(
      ip,
      Number(process.env.TRUST_PROXY_HOPS ?? 0) || 0,
    );
  }

  /** Cambia la contraseña y cierra las otras sesiones. */
  @Audited({
    action: 'PASSWORD_CHANGED',
    entity: 'authentication_credential',
  })
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
  @Audited({
    action: 'SESSION_REVOKED',
    entity: 'session',
    entityId: 'param:id',
  })
  @Post('me/sessions/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar una de mis sesiones' })
  revokeSession(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RevokeMySessionResultDto> {
    return this.service.revokeSession(actor, id);
  }

  /** «Fui yo»: reconoce el dispositivo del aviso de dispositivo nuevo. */
  @Audited({
    action: 'DEVICE_CONFIRMED',
    entity: 'device',
    entityId: 'param:id',
  })
  @Post('me/devices/:id/confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reconocer un dispositivo propio («Fui yo»)',
    description:
      'Solo desde una sesión abierta en otro dispositivo de confianza, o con ' +
      '`code`: el código de un solo uso enviado al correo verificado de la cuenta.',
  })
  confirmDevice(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmDeviceDto,
    @Ip() ip: string,
  ): Promise<ConfirmDeviceResultDto> {
    return this.service.confirmDevice(actor, id, ip, dto.code);
  }

  /**
   * Manda al correo verificado el código de un solo uso para «Fui yo».
   *
   * Es auditable: manda un correo a nombre de la cuenta y su cupo (3 por minuto)
   * es lo que frena a quien las agote; el asiento dice qué dispositivo se
   * pidió reconocer, no el código ni el correo.
   */
  @Audited({
    action: 'DEVICE_CONFIRM_CODE_REQUESTED',
    entity: 'device',
    entityId: 'param:id',
  })
  @Post('me/devices/:id/confirm-code')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Enviar al correo verificado el código para reconocer un dispositivo',
  })
  requestDeviceCode(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RequestDeviceCodeResultDto> {
    return this.service.requestDeviceCode(actor, id);
  }

  /** «No fui yo»: no reconoce el dispositivo; cierra las demás sesiones. */
  @Audited({
    action: 'DEVICE_REPORTED_NOT_ME',
    entity: 'device',
    entityId: 'param:id',
  })
  @Post('me/devices/:id/not-me')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'No reconocer un dispositivo («No fui yo») y cerrar las otras sesiones',
  })
  reportDeviceNotMe(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Ip() ip: string,
  ): Promise<ReportDeviceNotMeResultDto> {
    return this.service.reportDeviceNotMe(actor, id, ip);
  }

  /** Estado del segundo paso de la propia cuenta. */
  @Get('me/mfa')
  @ApiOperation({ summary: 'Estado de mi verificación en dos pasos' })
  mfaStatus(@CurrentUser() actor: AuthenticatedUser): Promise<MyMfaStatusDto> {
    return this.myMfa.status(actor);
  }

  /** Empieza el alta de la app autenticadora (TOTP). */
  @Audited({
    action: 'MFA_ENROLLMENT_STARTED',
    entity: 'mfa_factor',
    entityId: 'result.id',
  })
  @Post('me/mfa/totp')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Dar de alta mi app autenticadora (devuelve el secreto una vez)',
    description:
      'Exige reautenticación: `currentPassword` o `mfaCode` de un factor ya verificado.',
  })
  startTotp(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: StartMyTotpDto,
    @Ip() ip: string,
  ): Promise<MfaFactorResponseDto> {
    return this.myMfa.startTotp(actor, dto, ip);
  }

  /** Quita un factor propio (exige contraseña actual o código de un factor verificado). */
  @Audited({
    action: 'MFA_FACTOR_REVOKED',
    entity: 'mfa_factor',
    entityId: 'param:factorId',
  })
  @Post('me/mfa/:factorId/revoke')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quitar uno de mis factores de segundo paso',
  })
  revokeFactor(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('factorId', ParseUUIDPipe) factorId: string,
    @Body() dto: RevokeMyMfaDto,
    @Ip() ip: string,
  ): Promise<RevokeMyMfaResultDto> {
    return this.myMfa.revokeFactor(actor, factorId, dto, ip);
  }

  /** Confirma la app autenticadora con un código. */
  @Audited({
    action: 'MFA_FACTOR_CONFIRMED',
    entity: 'mfa_factor',
    entityId: 'param:factorId',
  })
  @Post('me/mfa/totp/:factorId/confirm')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar mi app autenticadora con un código' })
  confirmTotp(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('factorId', ParseUUIDPipe) factorId: string,
    @Body() dto: ConfirmMyTotpDto,
  ): Promise<ConfirmMyTotpResultDto> {
    return this.myMfa.confirmTotp(actor, factorId, dto);
  }
}
