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
  ReimbursementsRepository,
  InvoicesRepository,
  BillingDocumentLinksRepository,
} from '../repositories';
import { LinkReimbursementDto, ReimbursementResponseDto } from '../dto';
import { BILL } from '../billing.concepts';
import { fromCents, toCents } from '../money.util';

/**
 * UC-17-08: vincula el reembolso de un reclamo de seguro a la factura del paciente.
 * Registra el reembolso (POSTED), acredita la porción aseguradora al `paid_total`
 * de la factura y baja su saldo. Idempotente por `claim_id` (un reclamo no se
 * contabiliza dos veces en billing — ownership del reclamo vive en insurance).
 */
@Injectable()
export class ReimbursementsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param reimbursementsRepo - Valor de reimbursements repo requerido por la operación.
   * @param invoicesRepo - Valor de invoices repo requerido por la operación.
   * @param linksRepo - Valor de links repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reimbursementsRepo: ReimbursementsRepository,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly linksRepo: BillingDocumentLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReimbursementsService.name);
  }

  /**
   * Actualiza link.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de link conforme al contrato `Promise<ReimbursementResponseDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async link(
    dto: LinkReimbursementDto,
    actor: AuthenticatedUser,
  ): Promise<ReimbursementResponseDto> {
    this.logger.info(
      {
        operation: 'billing.reimbursement.link',
        claimId: dto.claimId,
        invoiceId: dto.invoiceId,
        actorId: actor.id,
      },
      'Linking claim reimbursement',
    );
    return this.em.transactional(async (tx) => {
      const existing = await this.reimbursementsRepo.findByClaim(
        tx,
        dto.claimId,
      );
      if (existing) {
        throw new ConflictException(
          'El reclamo ya tiene un reembolso registrado',
          { claimId: dto.claimId },
        );
      }

      const invoice = await this.invoicesRepo.findById(tx, dto.invoiceId);
      if (!invoice)
        throw new ResourceNotFoundException('Factura no encontrada', {
          invoiceId: dto.invoiceId,
        });

      const reimbursement = this.reimbursementsRepo.create(tx, {
        claimId: dto.claimId,
        amount: dto.amount,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        statusConceptId: BILL.REIMBURSEMENT_POSTED,
        actorUserId: actor.id,
      });
      await tx.flush();

      const balanceCents = toCents(invoice.balance ?? '0');
      const amountCents = toCents(dto.amount);
      const newPaidCents = toCents(invoice.paidTotal ?? '0') + amountCents;
      const newBalanceCents = Math.max(0, balanceCents - amountCents);
      invoice.paidTotal = fromCents(newPaidCents);
      invoice.balance = fromCents(newBalanceCents);
      invoice.statusConceptId =
        newBalanceCents === 0 ? BILL.INVOICE_PAID : BILL.INVOICE_PARTIALLY_PAID;
      touch(invoice, actor.id);

      if (dto.tenantId) {
        this.linksRepo.create(tx, {
          tenantId: dto.tenantId,
          relationTypeConceptId: BILL.REL_REIMBURSEMENT_OF,
          invoiceId: invoice.id,
          claimId: dto.claimId,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'billing.reimbursement.link',
          reimbursementId: reimbursement.id,
          invoiceId: invoice.id,
        },
        'Claim reimbursement linked',
      );
      return {
        id: reimbursement.id,
        claimId: reimbursement.claimId,
        amount: reimbursement.amount,
        status: reimbursement.statusConceptId,
        invoiceId: invoice.id,
        invoiceBalance: invoice.balance,
        invoiceStatus: invoice.statusConceptId,
      };
    });
  }
}
