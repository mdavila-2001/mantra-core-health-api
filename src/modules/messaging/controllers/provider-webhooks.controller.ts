import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common';
import { NotificationsService } from '../services';
import { ProviderReceiptDto, ProviderReceiptResponseDto } from '../dto';

/**
 * Webhooks de los proveedores de mensajería.
 *
 * Es la única superficie **pública** del módulo: quien llama es un tercero sin
 * sesión en el sistema. La verificación de firma la hace el conector de
 * integraciones, que es quien guarda el secreto (ver "Pendiente" en el README).
 */
@ApiTags('messaging-webhooks')
@Controller('webhooks/providers')
export class ProviderWebhooksController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** UC-35-12. */
  @Post(':providerCode/receipts')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Conciliar el acuse de entrega que envía el proveedor',
    description:
      'Idempotente por entrega y tipo de acuse: los proveedores reentregan.',
  })
  recordReceipt(
    @Param('providerCode') providerCode: string,
    @Body() dto: ProviderReceiptDto,
  ): Promise<ProviderReceiptResponseDto> {
    return this.notificationsService.recordProviderReceipt(providerCode, dto);
  }
}
