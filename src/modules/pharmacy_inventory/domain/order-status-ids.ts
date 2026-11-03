import { PINV } from './pharmacy_inventory.concepts';

/** Estados conocidos del ciclo de pedidos de paciente. */
export const ORDER_STATUS_IDS: readonly string[] = [
  PINV.ORDER_ENVIADO,
  PINV.ORDER_EN_REVISION,
  PINV.ORDER_CONFIRMADO,
  PINV.ORDER_ACEPTACION_PENDIENTE,
  PINV.ORDER_ACEPTADO,
  PINV.ORDER_LISTO_PARA_RETIRO,
  PINV.ORDER_RETIRADO,
  PINV.ORDER_RECHAZADO,
  PINV.ORDER_VENCIDO,
  PINV.ORDER_CANCELADO,
];
