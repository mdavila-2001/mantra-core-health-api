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
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../../common';
import { IamMyDevicesService } from '../../application/services';
import {
  ConfirmDeviceDto,
  DeviceCodeRequestedDto,
  DeviceConfirmedDto,
  MyDeviceDto,
} from '../dto';

/**
 * The account's own devices (Ajustes › Dispositivos). No `@Roles`: every session works on
 * its own devices and ownership comes from the token.
 */
@ApiTags('iam-auth')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('iam/me/devices')
export class IamMyDevicesController {
  constructor(private readonly service: IamMyDevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar los dispositivos donde inicié sesión' })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<MyDeviceDto[]> {
    return this.service.list(actor);
  }

  @Audited({
    action: 'DEVICE_CODE_SENT',
    entity: 'device',
    entityId: 'param:id',
  })
  @Post(':id/confirm-code')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar a mi correo el código para verificar un dispositivo',
  })
  requestCode(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeviceCodeRequestedDto> {
    return this.service.requestCode(actor, id);
  }

  @Audited({ action: 'DEVICE_TRUSTED', entity: 'device', entityId: 'param:id' })
  @Post(':id/confirm')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar un dispositivo con el código del correo',
  })
  confirm(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmDeviceDto,
  ): Promise<DeviceConfirmedDto> {
    return this.service.confirm(actor, id, dto.code);
  }
}
