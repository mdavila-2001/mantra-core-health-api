import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/api-key.guard';
import { NotificationsService } from './notifications.service';
import {
  SendNotificationDto,
  SendNotificationResponseDto,
} from './notifications.dto';

@ApiTags('notifications')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar una notificación (emulado)',
    description:
      'Refleja `NotificationProviderAdapter` del worker real: decide SENT/FAILED con la tasa configurada, nunca entrega nada de verdad.',
  })
  send(@Body() dto: SendNotificationDto): Promise<SendNotificationResponseDto> {
    return this.service.send(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar el resultado de un envío anterior' })
  findById(@Param('id') id: string): SendNotificationResponseDto {
    const found = this.service.findById(id);
    if (!found) {
      throw new NotFoundException(`No hay envío registrado con id ${id}`);
    }
    return found;
  }
}
