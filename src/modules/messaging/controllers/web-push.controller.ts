import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  WebPushConfigDto,
  WebPushSubscriptionDto,
  WebPushUnsubscribeDto,
} from '../dto/web-push.dto';
import {
  isAllowedPushEndpoint,
  WebPushService,
} from '../services/web-push.service';

/**
 * Suscripción de la persona a los avisos push del navegador. Cada cuenta sólo
 * administra sus propios navegadores: el dueño sale del token, nunca del cuerpo.
 */
@ApiTags('messaging')
@ApiBearerAuth()
@Controller('notifications/web-push')
export class WebPushController {
  constructor(private readonly webPush: WebPushService) {}

  @Get('config')
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({
    summary: 'Clave pública VAPID, o enabled=false si no hay push',
  })
  config(): WebPushConfigDto {
    const publicKey = this.webPush.publicKey();
    return { enabled: publicKey !== null, publicKey };
  }

  @Audited({
    action: 'WEB_PUSH_SUBSCRIBED',
    entity: 'device',
  })
  @Put('subscription')
  @HttpCode(204)
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Guarda la suscripción push de este navegador' })
  async subscribe(
    @Body() dto: WebPushSubscriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    this.assertKnownPushService(dto.endpoint);
    await this.webPush.subscribe(actor.id, dto);
  }

  @Audited({
    action: 'WEB_PUSH_UNSUBSCRIBED',
    entity: 'device',
  })
  @Delete('subscription')
  @HttpCode(204)
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Quita la suscripción push de este navegador' })
  async unsubscribe(
    @Body() dto: WebPushUnsubscribeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.webPush.unsubscribe(actor.id, dto.endpoint);
  }

  private assertKnownPushService(endpoint: string): void {
    if (!isAllowedPushEndpoint(endpoint)) {
      throw new BadRequestException(
        'La dirección de push no pertenece a un servicio de navegador conocido',
      );
    }
  }
}
