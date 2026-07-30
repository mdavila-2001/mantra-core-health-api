import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  InvoicesRepository,
  BillsRepository,
  PaymentsReceivedRepository,
  PaymentsMadeRepository,
} from '../repositories';
import { PostToLedgerDto, PostingResultDto } from '../dto';

/**
 * UC-17-06: contabiliza un documento (invoice/bill/payment) fijando su
 * `transaction_id` al asiento contable resuelto. Es idempotente por documento: si
 * ya tiene `transaction_id`, se rechaza con conflicto (no se contabiliza dos veces).
 * El asiento en sí lo produce el módulo de contabilidad; aquí se ancla la
 * referencia al documento origen de facturación.
 */
@Injectable()
export class LedgerService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param invoicesRepo - Valor de invoices repo requerido por la operación.
   * @param billsRepo - Valor de bills repo requerido por la operación.
   * @param paymentsReceivedRepo - Valor de payments received repo requerido por la operación.
   * @param paymentsMadeRepo - Valor de payments made repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly billsRepo: BillsRepository,
    private readonly paymentsReceivedRepo: PaymentsReceivedRepository,
    private readonly paymentsMadeRepo: PaymentsMadeRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LedgerService.name);
  }

  /**
   * Ejecuta la operación post to ledger.
   *
   * @param documentId - Identificador de document.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de post to ledger conforme al contrato `Promise<PostingResultDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async postToLedger(
    documentId: string,
    dto: PostToLedgerDto,
    actor: AuthenticatedUser,
  ): Promise<PostingResultDto> {
    this.logger.info(
      {
        operation: 'billing.ledger.post',
        documentId,
        documentType: dto.documentType,
        actorId: actor.id,
      },
      'Posting document to ledger',
    );
    return this.em.transactional(async (tx) => {
      const doc = await this.loadDocument(tx, documentId, dto.documentType);
      if (!doc) {
        throw new ResourceNotFoundException('Documento no encontrado', {
          documentId,
          documentType: dto.documentType,
        });
      }
      if (doc.transactionId) {
        throw new ConflictException('El documento ya fue contabilizado', {
          documentId,
          transactionId: doc.transactionId,
        });
      }

      doc.transactionId = dto.transactionId;
      // Los pagos no llevan updated_by en el touch estándar salvo que tengan updatedAt; todas estas entidades sí lo tienen.
      touch(doc, actor.id);

      this.logger.info(
        {
          operation: 'billing.ledger.post',
          documentId,
          transactionId: dto.transactionId,
        },
        'Document posted to ledger',
      );
      return {
        id: documentId,
        documentType: dto.documentType,
        transactionId: dto.transactionId,
        posted: true,
      };
    });
  }

  /**
   * Obtiene load document.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @param type - Valor de type requerido por la operación.
   * @returns Resultado de load document conforme al contrato `Promise<{
    transactionId?: string;
    updatedAt: Date;
    updatedByUserId?: string;
  } | null>`.
   */
  private loadDocument(
    tx: EntityManager,
    id: string,
    type: PostToLedgerDto['documentType'],
  ): Promise<{
    /**
     * Identificador asociado a transaction.
     */
    transactionId?: string;
    /**
     * Fecha y hora de la última actualización.
     */
    updatedAt: Date;
    /**
     * Identificador asociado a updated by user.
     */
    updatedByUserId?: string;
  } | null> {
    switch (type) {
      case 'INVOICE':
        return this.invoicesRepo.findById(tx, id);
      case 'BILL':
        return this.billsRepo.findById(tx, id);
      case 'PAYMENT_RECEIVED':
        return this.paymentsReceivedRepo.findById(tx, id);
      case 'PAYMENT_MADE':
        return this.paymentsMadeRepo.findById(tx, id);
      default:
        return Promise.resolve(null);
    }
  }
}
