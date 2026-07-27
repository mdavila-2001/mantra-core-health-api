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
import { FiscalRepository } from '../repositories';
import {
  CreateFiscalYearDto,
  LockPeriodDto,
  FiscalYearResponseDto,
  AccountingStatusDto,
} from '../dto';

/**
 * Casos de uso del calendario fiscal: apertura de ejercicio con sus periodos
 * (UC-16-04) y bloqueo/cierre de un periodo (UC-16-05). Un periodo CERRADO impide
 * postear asientos con ese `fiscal_period_id` (lo valida el libro mayor).
 */
@Injectable()
export class FiscalService {
  constructor(
    private readonly em: EntityManager,
    private readonly fiscalRepo: FiscalRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FiscalService.name);
  }

  /** UC-16-04: abre un ejercicio fiscal y sus periodos hijos en una sola tx. */
  async openFiscalYear(
    dto: CreateFiscalYearDto,
    actor: AuthenticatedUser,
  ): Promise<FiscalYearResponseDto> {
    this.logger.info(
      {
        operation: 'accounting.fiscalYear.open',
        code: dto.code,
        periods: dto.periods.length,
      },
      'Opening fiscal year',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.fiscalRepo.findYearByCode(
        tx,
        dto.practiceId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException('El ejercicio ya existe en la práctica', {
          code: dto.code,
        });
      }

      const year = this.fiscalRepo.createYear(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        statusConceptId: ACCT.YEAR_OPEN,
        actorUserId: actor.id,
      });
      // FK plana: el periodo referencia fiscal_year_id → persistir el padre antes.
      await tx.flush();

      const periodIds: string[] = [];
      for (const p of dto.periods) {
        const period = this.fiscalRepo.createPeriod(tx, {
          fiscalYearId: year.id,
          code: p.code,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          statusConceptId: ACCT.PERIOD_OPEN,
          actorUserId: actor.id,
        });
        periodIds.push(period.id);
      }
      await tx.flush();

      return {
        id: year.id,
        code: year.code,
        status: year.statusConceptId,
        periodIds,
      };
    });
  }

  /** UC-16-05: bloquea (cierra) un periodo ABIERTO. */
  async lockPeriod(
    periodId: string,
    _dto: LockPeriodDto,
    actor: AuthenticatedUser,
  ): Promise<AccountingStatusDto> {
    this.logger.info(
      {
        operation: 'accounting.fiscalPeriod.lock',
        periodId,
        actorId: actor.id,
      },
      'Locking fiscal period',
    );
    return this.em.transactional(async (tx) => {
      const period = await this.fiscalRepo.findPeriodById(tx, periodId);
      if (!period) {
        throw new ResourceNotFoundException('Periodo fiscal no encontrado', {
          periodId,
        });
      }
      if (period.statusConceptId !== ACCT.PERIOD_OPEN) {
        throw new PreconditionFailedException('El periodo no está ABIERTO', {
          periodId,
          status: period.statusConceptId,
        });
      }
      period.statusConceptId = ACCT.PERIOD_LOCKED;
      touch(period, actor.id);
      return { ok: true, id: period.id };
    });
  }
}
