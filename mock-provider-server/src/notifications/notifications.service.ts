import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MOCK_ENV } from '../common/env.module';
import type { MockProviderEnv } from '../common/env';
import { rollFailure, simulatedDelay } from '../common/simulate';
import {
  SendNotificationDto,
  SendNotificationResponseDto,
} from './notifications.dto';

/**
 * Emula un gateway de mensajería (Twilio/SendGrid/FCM/lo que sea). No entrega
 * nada de verdad — sólo decide SENT/FAILED con la tasa configurada y devuelve
 * una referencia con forma de las que da un proveedor real, para que el
 * worker que la consuma (`NotificationDeliveryJob`) ejercite el mismo camino
 * que tendría con un proveedor de producción.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sent = new Map<string, SendNotificationResponseDto>();

  constructor(@Inject(MOCK_ENV) private readonly env: MockProviderEnv) {}

  async send(dto: SendNotificationDto): Promise<SendNotificationResponseDto> {
    await simulatedDelay(this.env.simulatedLatencyMs);

    const id = randomUUID();
    const failed = rollFailure(this.env.notificationsFailureRate);
    const response: SendNotificationResponseDto = failed
      ? {
          id,
          outcome: 'FAILED',
          errorCode: 'SIMULATED_PROVIDER_ERROR',
          errorText:
            'El emulador decidió fallar este intento (tasa configurada)',
        }
      : {
          id,
          outcome: 'SENT',
          providerMessageRef: `mock-${dto.channel.toLowerCase()}-${id}`,
        };

    this.sent.set(id, response);
    this.logger.log(
      `${dto.channel} -> ${dto.to}: ${response.outcome}${
        response.errorCode ? ` (${response.errorCode})` : ''
      }`,
    );
    return response;
  }

  findById(id: string): SendNotificationResponseDto | undefined {
    return this.sent.get(id);
  }
}
