import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ACCT } from '../accounting.concepts';
import { SubledgerRepository } from '../repositories';
import { PostingHelper } from './posting.helper';
import { toCents, fromCents } from './money';
import {
  CreateOpenItemDto,
  CreateClearingDto,
  OpenItemResponseDto,
  ClearingResponseDto,
} from '../dto';

/**
 * Casos de uso de subledgers (AR/AP): generación de partida abierta ligada a una
 * línea del mayor (UC-16-08) y compensación/clearing de partidas abiertas con su
 * asiento de banco (UC-16-09, incluye UC-16-01 vía `PostingHelper`).
 */
@Injectable()
export class SubledgerService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subledgerRepo - Valor de subledger repo requerido por la operación.
   * @param posting - Valor de posting requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly subledgerRepo: SubledgerRepository,
    private readonly posting: PostingHelper,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SubledgerService.name);
  }

  /** UC-16-08: crea una partida abierta sobre una cuenta de reconciliación. */
  async createOpenItem(
    dto: CreateOpenItemDto,
    actor: AuthenticatedUser,
  ): Promise<OpenItemResponseDto> {
    this.logger.info(
      {
        operation: 'accounting.openItem.create',
        subledgerAccountId: dto.subledgerAccountId,
      },
      'Creating open item',
    );
    return this.em.transactional(async (tx) => {
      const subledger = await this.subledgerRepo.findSubledgerById(
        tx,
        dto.subledgerAccountId,
      );
      if (!subledger) {
        throw new ResourceNotFoundException('Subledger no encontrado', {
          subledgerAccountId: dto.subledgerAccountId,
        });
      }

      const item = this.subledgerRepo.createOpenItem(tx, {
        tenantId: dto.tenantId,
        subledgerAccountId: dto.subledgerAccountId,
        ledgerEntryId: dto.ledgerEntryId,
        documentTypeConceptId:
          dto.documentType === 'INVOICE'
            ? ACCT.DOC_TYPE_INVOICE
            : ACCT.DOC_TYPE_BILL,
        statusConceptId: ACCT.OPEN_ITEM_OPEN,
        documentNumber: dto.documentNumber,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        originalAmount: dto.originalAmount,
        outstandingAmount: dto.originalAmount,
        currencyConceptId: dto.currencyConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: item.id,
        status: item.statusConceptId,
        outstandingAmount: item.outstandingAmount ?? dto.originalAmount,
      };
    });
  }

  /** UC-16-09: compensa partidas abiertas y postea el asiento de banco. */
  async clearOpenItems(
    dto: CreateClearingDto,
    actor: AuthenticatedUser,
  ): Promise<ClearingResponseDto> {
    this.logger.info(
      { operation: 'accounting.clearing.create', items: dto.items.length },
      'Clearing open items',
    );
    return this.em.transactional(async (tx) => {
      // Cargar y validar cada partida; todas deben pertenecer al mismo subledger.
      const loaded = [];
      let subledgerAccountId: string | null = null;
      for (const it of dto.items) {
        const openItem = await this.subledgerRepo.findOpenItemById(
          tx,
          it.openItemId,
        );
        if (!openItem) {
          throw new ResourceNotFoundException('Partida abierta no encontrada', {
            openItemId: it.openItemId,
          });
        }
        if (openItem.statusConceptId === ACCT.OPEN_ITEM_CLEARED) {
          throw new ConflictException('La partida ya está compensada', {
            openItemId: it.openItemId,
          });
        }
        const cleared = toCents(it.clearedAmount);
        const outstanding = toCents(openItem.outstandingAmount ?? '0');
        if (cleared <= 0 || cleared > outstanding) {
          throw new PreconditionFailedException('Importe compensado inválido', {
            openItemId: it.openItemId,
            clearedAmount: it.clearedAmount,
            outstanding: fromCents(outstanding),
          });
        }
        subledgerAccountId = subledgerAccountId ?? openItem.subledgerAccountId;
        if (openItem.subledgerAccountId !== subledgerAccountId) {
          throw new PreconditionFailedException(
            'Las partidas no comparten subledger',
            {
              openItemId: it.openItemId,
            },
          );
        }
        loaded.push({
          input: it,
          entity: openItem,
          clearedCents: cleared,
          outstandingCents: outstanding,
        });
      }

      const subledger = await this.subledgerRepo.findSubledgerById(
        tx,
        subledgerAccountId as string,
      );
      if (!subledger) {
        throw new ResourceNotFoundException('Subledger no encontrado', {
          subledgerAccountId,
        });
      }

      const totalCleared = loaded.reduce((acc, l) => acc + l.clearedCents, 0);
      const number = dto.clearingNumber ?? this.posting.generateNumber('CLR');
      const clash = await this.subledgerRepo.findClearingByNumber(
        tx,
        dto.tenantId,
        number,
      );
      if (clash) {
        throw new ConflictException(
          'El número de clearing ya existe en el tenant',
          {
            clearingNumber: number,
          },
        );
      }

      // Asiento de banco: D banco / H cuenta de reconciliación del subledger.
      const posted = await this.posting.post(tx, {
        practiceId: dto.practiceId,
        transactionTypeConceptId: ACCT.TXN_TYPE_CLEARING,
        transactionNumber: this.posting.generateNumber('CLRJ'),
        transactionDate: new Date(dto.clearingDate),
        description: `Compensación ${number}`,
        reference: number,
        lines: [
          {
            accountId: dto.bankAccountId,
            direction: 'DEBIT',
            amount: fromCents(totalCleared),
          },
          {
            accountId: subledger.reconciliationAccountId,
            direction: 'CREDIT',
            amount: fromCents(totalCleared),
            subledgerAccountId: subledger.id,
          },
        ],
        actorUserId: actor.id,
      });

      const clearingDoc = this.subledgerRepo.createClearingDocument(tx, {
        tenantId: dto.tenantId,
        clearingNumber: number,
        transactionId: posted.transactionId,
        statusConceptId: ACCT.CLEARING_COMPLETED,
        clearingDate: new Date(dto.clearingDate),
        companyBankAccountId: dto.companyBankAccountId,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const l of loaded) {
        this.subledgerRepo.createClearingItem(tx, {
          clearingDocumentId: clearingDoc.id,
          openItemId: l.entity.id,
          clearedAmount: l.input.clearedAmount,
          currencyConceptId: l.entity.currencyConceptId,
          discountAmount: l.input.discountAmount,
          exchangeDifferenceAmount: l.input.exchangeDifferenceAmount,
          actorUserId: actor.id,
        });
        const remaining = l.outstandingCents - l.clearedCents;
        l.entity.outstandingAmount = fromCents(remaining);
        l.entity.statusConceptId =
          remaining === 0 ? ACCT.OPEN_ITEM_CLEARED : ACCT.OPEN_ITEM_PARTIAL;
        touch(l.entity, actor.id);
      }

      return {
        id: clearingDoc.id,
        clearingNumber: clearingDoc.clearingNumber,
        transactionId: posted.transactionId,
        clearedItems: loaded.length,
      };
    });
  }
}
