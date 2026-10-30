import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('mantra.payments-gateway');
const requiredCounter = meter.createCounter(
  'payments_gateway_dispatch_reconciliation_required_total',
  {
    description:
      'Veces que una reserva de despacho sin pi_ quedó o siguió pendiente de conciliación',
  },
);
const reconciledCounter = meter.createCounter(
  'payments_gateway_dispatch_reconciled_total',
  { description: 'Conciliaciones de una reserva de despacho, por resultado' },
);

const unknownTerminalCounter = meter.createCounter(
  'payments_gateway_webhook_unknown_terminal_total',
  {
    description:
      'Webhooks terminales de un pi_ que ninguna intención tiene (cobro huérfano): la pasarela los reintenta',
  },
);

/**
 * Métricas del despacho por la pasarela. Baja cardinalidad: sólo etiquetas
 * cerradas, nunca el id de la intención, de la deuda ni del tenant.
 */
export const gatewayMetrics = {
  /** Una reserva sin `pi_` requiere conciliación (`stale_blocks_debt`, `stale_own_retry`, `too_old_to_resend`, `key_reused`). */
  reconciliationRequired(reason: string): void {
    requiredCounter.add(1, { reason });
  },
  /** Llegó un terminal de un `pi_…` sin intención (cobro huérfano, p. ej. tras un cierre manual). */
  unknownTerminalWebhook(): void {
    unknownTerminalCounter.add(1);
  },
  /** Una conciliación terminó (`replayed`, `created`, `rejected`, `ambiguous`). */
  reconciled(outcome: string): void {
    reconciledCounter.add(1, { outcome });
  },
};
