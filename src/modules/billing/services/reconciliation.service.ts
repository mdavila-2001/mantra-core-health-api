import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PaymentsReceivedRepository,
  PaymentsMadeRepository,
} from '../repositories';
import { ReconciliationClearDto, ReconciliationResultDto } from '../dto';
import { BILL } from '../billing.concepts';

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
      );
    }

    return this.em.transactional(async (tx) => {
      let reconciledReceived = 0;
      for (const id of receivedIds) {
        const p = await this.paymentsReceivedRepo.findById(tx, id);
        if (!p)
          throw new ResourceNotFoundException('Pago recibido no encontrado', {
            paymentReceivedId: id,
          });
        if (p.clearingDocumentId) {
          throw new PreconditionFailedException(
            'El pago recibido ya está conciliado',
            { paymentReceivedId: id },
          );
        }
        p.clearingDocumentId = dto.clearingDocumentId;
        p.statusConceptId = BILL.PAYMENT_RECONCILED;
        touch(p, actor.id);
        reconciledReceived++;
      }

      let reconciledMade = 0;
      for (const id of madeIds) {
        const p = await this.paymentsMadeRepo.findById(tx, id);
        if (!p)
          throw new ResourceNotFoundException('Pago emitido no encontrado', {
            paymentMadeId: id,
          });
        if (p.clearingDocumentId) {
          throw new PreconditionFailedException(
            'El pago emitido ya está conciliado',
            { paymentMadeId: id },
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
