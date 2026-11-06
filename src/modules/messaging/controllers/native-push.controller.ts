import { Body, Controller, Delete, HttpCode, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  NativePushTokenDeleteDto,
  NativePushTokenDto,
} from '../dto/native-push.dto';
import { NativePushService } from '../services/native-push.service';

/**
 * Native push token of the mobile app (FCM). Each account manages only its own
 * installs: the owner comes from the access token, never from the body.
 */
@ApiTags('messaging')
@ApiBearerAuth()
@Controller('notifications/native-push')
export class NativePushController {
  constructor(private readonly nativePush: NativePushService) {}

  @Audited({ action: 'NATIVE_PUSH_TOKEN_REGISTERED', entity: 'device' })
  @Put('token')
  @HttpCode(204)
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Guarda el token push (FCM) de esta instalación' })
  async register(
    @Body() dto: NativePushTokenDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.nativePush.registerToken(actor.id, dto);
  }

  @Audited({ action: 'NATIVE_PUSH_TOKEN_REMOVED', entity: 'device' })
  @Delete('token')
  @HttpCode(204)
  @Roles('USER', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Quita el token push (FCM) de esta instalación' })
  async unregister(
    @Body() dto: NativePushTokenDeleteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    await this.nativePush.unregisterToken(actor.id, dto.token);
  }
}
