import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GatewayEventDecision } from '../gateway/payments-gateway-status';

/** Respuesta `200` al webhook de la pasarela: sólo se envía cuando el efecto quedó persistido. */
export class GatewayWebhookResultDto {
  /**
   * Siempre `true`: el evento se verificó y se procesó (o se ignoró a propósito).
   */
  @ApiProperty({ example: true })
  received!: true;

  /**
   * Id del evento (`webhook-id`).
   */
  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  /**
   * `true` si el evento cambió el estado local.
   */
  @ApiProperty()
  applied!: boolean;

  /**
   * `true` si el evento ya estaba archivado: la reentrega no repite el efecto.
   */
  @ApiProperty()
  duplicate!: boolean;

  /**
   * `true` si el evento no corresponde a esta API (otro tipo de evento o un cobro desconocido no terminal).
   */
  @ApiProperty()
  ignored!: boolean;

  /**
   * `true` si el evento quedó archivado sin procesar para conciliación humana.
   */
  @ApiProperty()
  reconciliationRequired!: boolean;

  /**
   * Cómo se interpretó el evento contra el estado local.
   */
  @ApiPropertyOptional({
    enum: ['aplicar', 'duplicado', 'obsoleto', 'contradiccion'],
  })
  decision?: GatewayEventDecision;
}
