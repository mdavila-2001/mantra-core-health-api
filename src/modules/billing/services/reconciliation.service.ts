import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';
import {
  PaymentsReceivedRepository,
  PaymentsMadeRepository,
} from '../repositories';
import { ReconciliationClearDto, ReconciliationResultDto } from '../dto';
import { BILL } from '../billing.concepts';
import { PracticeTenantLookupService } from '../../practice/services';
import { activeTenantId, assertDocumentInTenant } from '../billing-scope';

/** "No existe" del pago recibido a conciliar; el ajeno responde idéntico. */
const PAYMENT_RECEIVED_NOT_FOUND = {
  message: 'Pago recibido no encontrado',
  reason: BillingErrorReason.RECONCILIATION_PAYMENT_RECEIVED_NOT_FOUND,
};

/** "No existe" del pago emitido a conciliar; el ajeno responde idéntico. */
const PAYMENT_MADE_NOT_FOUND = {
  message: 'Pago emitido no encontrado',
  reason: BillingErrorReason.RECONCILIATION_PAYMENT_MADE_NOT_FOUND,
};

/**
 * UC-17-07: concilia pagos vía un documento de compensación. Marca los pagos
 * (recibidos y/o emitidos) con `clearing_document_id` y estado RECONCILED. Un pago
 * ya conciliado no puede volver a conciliarse.
 */
@Injectable()
export class ReconciliationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param paymentsReceivedRepo - Valor de payments received repo requerido por la operación.
   * @param paymentsMadeRepo - Valor de payments made repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly paymentsReceivedRepo: PaymentsReceivedRepository,
    private readonly paymentsMadeRepo: PaymentsMadeRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReconciliationService.name);
  }

  /**
   * Ejecuta la operación clear.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de clear conforme al contrato `Promise<ReconciliationResultDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async clear(
    dto: ReconciliationClearDto,
    actor: AuthenticatedUser,
  ): Promise<ReconciliationResultDto> {
    this.logger.info(
      {
        operation: 'billing.reconciliation.clear',
        clearingDocumentId: dto.clearingDocumentId,
        actorId: actor.id,
      },
      'Clearing payments',
    );
    const receivedIds = dto.paymentReceivedIds ?? [];
    const madeIds = dto.paymentMadeIds ?? [];
    if (receivedIds.length === 0 && madeIds.length === 0) {
      throw new PreconditionFailedException(
        'Debe indicar al menos un pago a conciliar',
        {},
        BillingErrorReason.RECONCILIATION_NO_PAYMENTS_SELECTED,
      );
    }

    const tenantId = activeTenantId();
    return this.em.transactional(async (tx) => {
      // Todo pago se acota al tenant ANTES de conciliar el primero: uno ajeno en
      // el lote no deja a medias a los demás ni se distingue de uno inexistente.
      const received = [];
      for (const id of receivedIds) {
        received.push(
          await assertDocumentInTenant(
            this.practiceTenantLookup,
            await this.paymentsReceivedRepo.findById(tx, id),
            tenantId,
            PAYMENT_RECEIVED_NOT_FOUND,
          ),
        );
      }
      const made = [];
      for (const id of madeIds) {
        made.push(
          await assertDocumentInTenant(
            this.practiceTenantLookup,
            await this.paymentsMadeRepo.findById(tx, id),
            tenantId,
            PAYMENT_MADE_NOT_FOUND,
          ),
        );
      }

      let reconciledReceived = 0;
      for (const [index, p] of received.entries()) {
        const id = receivedIds[index];
        if (p.clearingDocumentId) {
          throw new PreconditionFailedException(
            'El pago recibido ya está conciliado',
            { paymentReceivedId: id },
            BillingErrorReason.RECONCILIATION_PAYMENT_RECEIVED_ALREADY_CLEARED,
          );
        }
        p.clearingDocumentId = dto.clearingDocumentId;
        p.statusConceptId = BILL.PAYMENT_RECONCILED;
        touch(p, actor.id);
        reconciledReceived++;
      }

      let reconciledMade = 0;
      for (const [index, p] of made.entries()) {
        const id = madeIds[index];
        if (p.clearingDocumentId) {
          throw new PreconditionFailedException(
            'El pago emitido ya está conciliado',
            { paymentMadeId: id },
            BillingErrorReason.RECONCILIATION_PAYMENT_MADE_ALREADY_CLEARED,
          );
        }
        p.clearingDocumentId = dto.clearingDocumentId;
        p.statusConceptId = BILL.PAYMENT_RECONCILED;
        touch(p, actor.id);
        reconciledMade++;
      }

      this.logger.info(
        {
          operation: 'billing.reconciliation.clear',
          reconciledReceived,
          reconciledMade,
        },
        'Payments reconciled',
      );
      return {
        clearingDocumentId: dto.clearingDocumentId,
        reconciledReceived,
        reconciledMade,
      };
    });
  }
}
