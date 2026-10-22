import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ACCT } from '../accounting.concepts';
import { LiabilityRepository } from '../repositories';
import { PostingHelper, type PostingLine } from './posting.helper';
import { toCents, fromCents } from './money';
import { PayLiabilityDto, LiabilityPaymentResponseDto } from '../dto';

/**
 * UC-16-12: liquida una cuota de pasivo separando principal e interés y posteando
 * el asiento (D pasivo principal + D gasto interés / H banco), balanceado. Incluye
 * UC-16-01 vía `PostingHelper`.
 */
@Injectable()
export class LiabilityService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param liabilityRepo - Valor de liability repo requerido por la operación.
   * @param posting - Valor de posting requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly liabilityRepo: LiabilityRepository,
    private readonly posting: PostingHelper,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LiabilityService.name);
  }

  /**
   * Ejecuta la operación pay liability.
   *
   * @param liabilityId - Identificador de liability.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de pay liability conforme al contrato `Promise<LiabilityPaymentResponseDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async payLiability(
    liabilityId: string,
    dto: PayLiabilityDto,
    actor: AuthenticatedUser,
  ): Promise<LiabilityPaymentResponseDto> {
    this.logger.info(
      { operation: 'accounting.liability.pay', liabilityId, actorId: actor.id },
      'Registering liability payment',
    );

    const principalCents = toCents(dto.principalComponent);
    const interestCents = toCents(dto.interestComponent);
    const amountCents = toCents(dto.amount);
    if (principalCents + interestCents !== amountCents) {
      throw new PreconditionFailedException(
        'principal + interés no iguala el importe',
        {
          amount: dto.amount,
          principalComponent: dto.principalComponent,
          interestComponent: dto.interestComponent,
        },
      );
    }
    if (amountCents <= 0) {
      throw new PreconditionFailedException('El pago debe ser positivo', {});
    }

    return this.em.transactional(async (tx) => {
      const liability = await this.liabilityRepo.findById(tx, liabilityId);
      if (!liability) {
        throw new ResourceNotFoundException('Pasivo no encontrado', {
          liabilityId,
        });
      }
      if (liability.statusConceptId !== ACCT.LIABILITY_ACTIVE) {
        throw new PreconditionFailedException('El pasivo no está ACTIVO', {
          liabilityId,
          status: liability.statusConceptId,
        });
      }
      if (!liability.accountId) {
        throw new PreconditionFailedException(
          'El pasivo no tiene cuenta contable',
          { liabilityId },
        );
      }

      let schedule = null;
      if (dto.liabilityScheduleId) {
        // `FOR UPDATE`: dos pagos simultáneos de la misma cuota se serializan
        // acá, y el segundo la ve ya PAGADA (T26 · AC-26-13).
        schedule = await this.liabilityRepo.findScheduleById(
          tx,
          dto.liabilityScheduleId,
          { forUpdate: true },
        );
        if (!schedule || schedule.liabilityId !== liabilityId) {
          throw new ResourceNotFoundException(
            'Cuota no encontrada para el pasivo',
            {
              liabilityScheduleId: dto.liabilityScheduleId,
            },
          );
        }
        // Idempotencia por cuota: una cuota se paga una sola vez. Repetir el
        // pago no crea una segunda fila en `liability_payments` ni un segundo
        // asiento; responde 422, que es distinto de "no encontrada".
        if (schedule.statusConceptId === ACCT.LIAB_SCHEDULE_PAID) {
          throw new PreconditionFailedException('La cuota ya está pagada', {
            liabilityScheduleId: dto.liabilityScheduleId,
            installmentNumber: schedule.installmentNumber,
          });
        }
      }

      // Construir las líneas del asiento (débitos condicionales por componente).
      const lines: PostingLine[] = [];
      let principalIdx = -1;
      let interestIdx = -1;
      if (principalCents > 0) {
        principalIdx = lines.length;
        lines.push({
          accountId: liability.accountId,
          direction: 'DEBIT',
          amount: dto.principalComponent,
          liabilityId,
        });
      }
      if (interestCents > 0) {
        interestIdx = lines.length;
        lines.push({
          accountId: dto.interestExpenseAccountId,
          direction: 'DEBIT',
          amount: dto.interestComponent,
          liabilityId,
        });
      }
      lines.push({
        accountId: dto.bankAccountId,
        direction: 'CREDIT',
        amount: dto.amount,
      });

      const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
      const posted = await this.posting.post(tx, {
        practiceId: dto.practiceId,
        transactionTypeConceptId: ACCT.TXN_TYPE_LIABILITY_PAYMENT,
        transactionNumber: this.posting.generateNumber('LIABP'),
        transactionDate: paidAt,
        description: `Pago de pasivo ${liability.code}`,
        reference: liability.code,
        lines,
        actorUserId: actor.id,
      });

      const payment = this.liabilityRepo.createPayment(tx, {
        liabilityId,
        transactionId: posted.transactionId,
        amount: dto.amount,
        principalComponent: dto.principalComponent,
        interestComponent: dto.interestComponent,
        paidAt,
        actorUserId: actor.id,
      });

      if (principalIdx >= 0) {
        this.liabilityRepo.createPosting(tx, {
          liabilityId,
          ledgerEntryId: posted.entryIds[principalIdx],
          componentConceptId: ACCT.COMPONENT_PRINCIPAL,
          liabilityScheduleId: dto.liabilityScheduleId,
          amount: dto.principalComponent,
          actorUserId: actor.id,
        });
      }
      if (interestIdx >= 0) {
        this.liabilityRepo.createPosting(tx, {
          liabilityId,
          ledgerEntryId: posted.entryIds[interestIdx],
          componentConceptId: ACCT.COMPONENT_INTEREST,
          liabilityScheduleId: dto.liabilityScheduleId,
          amount: dto.interestComponent,
          actorUserId: actor.id,
        });
      }

      const outstanding =
        toCents(liability.outstandingAmount ?? '0') - principalCents;
      const remaining = Math.max(outstanding, 0);
      liability.outstandingAmount = fromCents(remaining);
      if (remaining === 0) {
        liability.statusConceptId = ACCT.LIABILITY_SETTLED;
      }
      touch(liability, actor.id);

      if (schedule) {
        schedule.paidAmount = fromCents(
          toCents(schedule.paidAmount ?? '0') + amountCents,
        );
        schedule.statusConceptId = ACCT.LIAB_SCHEDULE_PAID;
        touch(schedule, actor.id);
      }

      await tx.flush();

      return {
        id: payment.id,
        transactionId: posted.transactionId,
        liabilityStatus: liability.statusConceptId,
        outstandingAmount: liability.outstandingAmount ?? '0.00',
      };
    });
  }
}
