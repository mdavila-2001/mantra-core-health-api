import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common';
import { IntegrationsWebhooksService } from '../services';
import { InboundWebhookDto, InboundMessageResponseDto } from '../dto';

/**
 * Recepción de webhooks entrantes desde el gateway externo. Endpoint público (el
 * gateway no porta token de usuario); la autenticidad se establece por la firma
 * HMAC verificada contra la suscripción y el tenant se deriva de la conexión.
 */
@ApiTags('integrations-webhooks')
@Controller('integrations')
export class IntegrationsWebhooksController {
  constructor(private readonly webhooksService: IntegrationsWebhooksService) {}

  /** UC-12-09. */
  @Post('webhooks/inbound')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Recibir un mensaje entrante (idempotencia por firma)',
  })
  receiveInbound(
    @Body() dto: InboundWebhookDto,
  ): Promise<InboundMessageResponseDto> {
    return this.webhooksService.receiveInbound(dto);
  }
}
