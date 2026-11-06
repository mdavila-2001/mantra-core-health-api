import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotAudited, Public } from '../../../common';
import { PaymentsGatewayWebhookService } from '../services/payments-gateway-webhook.service';
import { GatewayWebhookResultDto } from '../dto';
import type { RawBodyRequest } from '../gateway/payments-gateway-raw-body';

/**
 * Receptor de webhooks de la pasarela de pagos ALOVIDA (carril INT, REQ-INT-2).
 *
 * La ruta es pública porque la pasarela no presenta un token de usuario: la
 * autenticidad la prueba la firma Standard Webhooks sobre el cuerpo crudo y la
 * ventana de la marca de tiempo, que el servicio verifica antes de tocar la base.
 */
@ApiTags('payments-gateway-webhooks')
@Controller('payments/gateway-webhooks')
export class PaymentsGatewayWebhooksController {
  /**
   * @param webhooks - Servicio que verifica y aplica el evento.
   */
  constructor(private readonly webhooks: PaymentsGatewayWebhookService) {}

  /** REQ-INT-2. */
  @Public()
  @NotAudited(
    'Evento de la pasarela archivado en payment_webhook_events por PaymentsGatewayWebhookService.',
  )
  // Margen sobre el límite global: la pasarela reintenta con espera creciente y
  // una ráfaga de eventos legítimos no debe agotar el cubo de su IP.
  @Throttle({ default: { limit: 600, ttl: 60_000 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recibir un webhook de la pasarela de pagos (idempotente)',
    description:
      'Verifica la firma Standard Webhooks y la marca de tiempo, aplica `payment_intent.*` una sola vez (inbox por `webhook-id`) y responde 2xx solo cuando el efecto quedó persistido. Con `payments.via_gateway` apagado responde 503 sin efecto.',
  })
  receive(
    @Req() req: RawBodyRequest,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<GatewayWebhookResultDto> {
    return this.webhooks.receive({ headers, rawBody: req.rawBody });
  }
}
