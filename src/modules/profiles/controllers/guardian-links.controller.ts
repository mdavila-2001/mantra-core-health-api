import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  Public,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  ConfirmGuardianLinkDto,
  ConfirmGuardianLinkResponseDto,
  GuardianLinkDeliveryDto,
  GuardianLinkDeliveryResponseDto,
  GuardianLinkIssueResponseDto,
  IssueGuardianLinkDto,
} from '../dto';
import type { GuardianLinkIssueResponse } from '../guardian-link.contract';
import { GuardianLinkService } from '../services/guardian-link.service';

/**
 * Lo que el worker de mensajería llama al consumir la cola `guardian-links`.
 *
 * Bajo `/internal` y sólo para la cuenta de servicio, como el resto de los
 * endpoints que mueven trabajo sin un humano detrás. Ambos son idempotentes.
 */
@ApiTags('profiles-internal')
@ApiBearerAuth()
@Controller('internal/guardian-links')
export class GuardianLinksInternalController {
  constructor(private readonly guardianLinks: GuardianLinkService) {}

  /** Emite (o reemite tras un fallo) la invitación de un evento. */
  @Post('issue')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Emitir la invitación al tutor de un evento GuardianLinkRequested',
    description:
      'Una invitación por evento. Devuelve SEND con destino E.164 y texto, SKIP si ya salió o se confirmó, o INVALID_PHONE (terminal).',
  })
  @ApiOkResponse({ type: GuardianLinkIssueResponseDto })
  issue(
    @Body() dto: IssueGuardianLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GuardianLinkIssueResponse> {
    return this.guardianLinks.issue(dto, actor.id);
  }

  /** Asienta el resultado del envío. */
  @Post(':id/delivery')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar el resultado del envío al tutor' })
  @ApiOkResponse({ type: GuardianLinkDeliveryResponseDto })
  @ApiNotFoundResponse({ description: 'La invitación no existe' })
  recordDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GuardianLinkDeliveryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GuardianLinkDeliveryResponseDto> {
    return this.guardianLinks.recordDelivery(id, dto, actor.id);
  }
}

/**
 * Mismo límite por IP que el resto de la superficie pública: holgado para
 * quien toca el enlace, estrecho para quien intenta adivinar tokens (que de
 * todos modos son 256 bits).
 */
const PUBLIC_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };

/**
 * La confirmación del tutor, sin sesión: el tutor de un paciente de mostrador
 * no tiene cuenta. El token viaja en el cuerpo, no en la ruta, para que no
 * quede en los logs de acceso de la API.
 */
@ApiTags('profiles-public')
@Throttle(PUBLIC_RATE_LIMIT)
@Controller('public/guardian-links')
export class GuardianLinksPublicController {
  constructor(private readonly guardianLinks: GuardianLinkService) {}

  /** El tutor confirma que el teléfono es suyo. */
  @Public()
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Confirmar el vínculo con el token del enlace',
    description:
      'De un solo uso y sin datos del paciente en la respuesta. No otorga la tutela legal.',
  })
  @ApiOkResponse({ type: ConfirmGuardianLinkResponseDto })
  @ApiNotFoundResponse({ description: 'Enlace desconocido o ya usado' })
  @ApiUnprocessableEntityResponse({ description: 'Enlace vencido' })
  confirm(
    @Body() dto: ConfirmGuardianLinkDto,
  ): Promise<ConfirmGuardianLinkResponseDto> {
    return this.guardianLinks.confirm(dto.token);
  }
}
