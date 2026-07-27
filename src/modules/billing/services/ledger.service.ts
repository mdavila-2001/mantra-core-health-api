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

  private loadDocument(
    tx: EntityManager,
    id: string,
    type: PostToLedgerDto['documentType'],
  ): Promise<{
    transactionId?: string;
    updatedAt: Date;
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
