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
import { AccrualRepository } from '../repositories';
import { PostingHelper } from './posting.helper';
import { sumCents, toCents, fromCents } from './money';
import {
  CreateAccrualObjectDto,
  RunAccrualsDto,
  AccrualObjectResponseDto,
  AccrualRunResponseDto,
} from '../dto';

/**
 * Casos de uso de devengos: alta del objeto de devengo con su cronograma
 * (UC-16-06) y corrida periódica idempotente que postea el asiento de devengo
 * (D gasto / H devengo) por cada línea pendiente del periodo (UC-16-07, incluye
 * UC-16-01 vía `PostingHelper`).
 */
@Injectable()
export class AccrualService {
  constructor(
    private readonly em: EntityManager,
    private readonly accrualRepo: AccrualRepository,
    private readonly posting: PostingHelper,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccrualService.name);
  }

  /** UC-16-06: crea el objeto de devengo y su cronograma (sum(planned)=total). */
  async createAccrualObject(
    dto: CreateAccrualObjectDto,
    actor: AuthenticatedUser,
  ): Promise<AccrualObjectResponseDto> {
    this.logger.info(
      { operation: 'accounting.accrual.create', objectNumber: dto.objectNumber },
      'Creating accrual object',
    );
    const plannedTotal = sumCents(dto.schedule.map((s) => s.plannedAmount));
    if (plannedTotal !== toCents(dto.totalAmount)) {
      throw new PreconditionFailedException('La suma del cronograma no iguala el total', {
        total: dto.totalAmount,
        planned: fromCents(plannedTotal),
      });
    }

    return this.em.transactional(async (tx) => {
      const clash = await this.accrualRepo.findObjectByNumber(tx, dto.tenantId, dto.objectNumber);
      if (clash) {
        throw new ConflictException('El número de objeto ya existe en el tenant', {
          objectNumber: dto.objectNumber,
        });
      }

      const object = this.accrualRepo.createObject(tx, {
        tenantId: dto.tenantId,
        objectNumber: dto.objectNumber,
        accrualTypeConceptId: ACCT.ACCRUAL_TYPE_DEFAULT,
        statusConceptId: ACCT.ACCRUAL_ACTIVE,
        expenseAccountId: dto.expenseAccountId,
        accrualAccountId: dto.accrualAccountId,
        costCenterId: dto.costCenterId,
        profitCenterId: dto.profitCenterId,
        contractId: undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        totalAmount: dto.totalAmount,
        currencyConceptId: dto.currencyConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();

      const scheduleLineIds: string[] = [];
      for (const s of dto.schedule) {
        const line = this.accrualRepo.createScheduleLine(tx, {
          accrualObjectId: object.id,
          fiscalPeriodId: s.fiscalPeriodId,
          plannedAmount: s.plannedAmount,
          postedAmount: '0',
          currencyConceptId: dto.currencyConceptId,
          statusConceptId: ACCT.SCHEDULE_PENDING,
          actorUserId: actor.id,
        });
        scheduleLineIds.push(line.id);
      }
      await tx.flush();

      return {
        id: object.id,
        objectNumber: object.objectNumber,
        status: object.statusConceptId,
        scheduleLineIds,
      };
    });
  }

  /** UC-16-07: postea las líneas PENDIENTES del periodo (idempotente por línea). */
  async runAccruals(dto: RunAccrualsDto, actor: AuthenticatedUser): Promise<AccrualRunResponseDto> {
    this.logger.info(
      { operation: 'accounting.accrual.run', accrualObjectId: dto.accrualObjectId, periodId: dto.fiscalPeriodId },
      'Running accrual batch',
    );
    return this.em.transactional(async (tx) => {
      const object = await this.accrualRepo.findObjectById(tx, dto.accrualObjectId);
      if (!object) {
        throw new ResourceNotFoundException('Objeto de devengo no encontrado', {
          accrualObjectId: dto.accrualObjectId,
        });
      }
      if (!object.expenseAccountId || !object.accrualAccountId) {
        throw new PreconditionFailedException('El objeto de devengo no define cuentas', {
          accrualObjectId: dto.accrualObjectId,
        });
      }

      const pending = await this.accrualRepo.pendingLinesForPeriod(
        tx,
        dto.accrualObjectId,
        dto.fiscalPeriodId,
        ACCT.SCHEDULE_PENDING,
      );
      if (pending.length === 0) {
        throw new PreconditionFailedException('No hay líneas de devengo pendientes en el periodo', {
          accrualObjectId: dto.accrualObjectId,
          fiscalPeriodId: dto.fiscalPeriodId,
        });
      }

      const transactionIds: string[] = [];
      for (const line of pending) {
        const amount = line.plannedAmount ?? '0';
        const result = await this.posting.post(tx, {
          practiceId: dto.practiceId,
          transactionTypeConceptId: ACCT.TXN_TYPE_ACCRUAL,
          transactionNumber: this.posting.generateNumber('ACR'),
          transactionDate: new Date(dto.postingDate),
          fiscalPeriodId: dto.fiscalPeriodId,
          currencyConceptId: object.currencyConceptId,
          description: `Devengo ${object.objectNumber}`,
          reference: object.objectNumber,
          lines: [
            {
              accountId: object.expenseAccountId,
              direction: 'DEBIT',
              amount,
              costCenterId: object.costCenterId,
              profitCenterId: object.profitCenterId,
            },
            {
              accountId: object.accrualAccountId,
              direction: 'CREDIT',
              amount,
              costCenterId: object.costCenterId,
              profitCenterId: object.profitCenterId,
            },
          ],
          actorUserId: actor.id,
        });

        this.accrualRepo.createPosting(tx, {
          accrualScheduleLineId: line.id,
          ledgerEntryId: result.entryIds[0],
          amount,
          currencyConceptId: object.currencyConceptId,
          postingDate: new Date(dto.postingDate),
          actorUserId: actor.id,
        });

        line.postedAmount = amount;
        line.statusConceptId = ACCT.SCHEDULE_POSTED;
        touch(line, actor.id);

        transactionIds.push(result.transactionId);
      }

      return { postedLines: pending.length, transactionIds };
    });
  }
}
