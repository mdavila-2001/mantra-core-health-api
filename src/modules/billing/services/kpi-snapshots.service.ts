import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { KpiSnapshotsRepository } from '../repositories';
import { ComputeKpiSnapshotDto, KpiSnapshotResponseDto } from '../dto';

/**
 * UC-17-12: registra un snapshot de KPI financiero / aging (tabla LOG,
 * append-only). Idempotente por (práctica, periodo fiscal, kpi_code, computed_at):
 * recalcular con la misma marca no duplica la fila.
 */
@Injectable()
export class KpiSnapshotsService {
  constructor(
    private readonly em: EntityManager,
    private readonly kpiRepo: KpiSnapshotsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(KpiSnapshotsService.name);
  }

  async compute(
    dto: ComputeKpiSnapshotDto,
    actor: AuthenticatedUser,
  ): Promise<KpiSnapshotResponseDto> {
    this.logger.info(
      {
        operation: 'billing.kpi.compute',
        practiceId: dto.practiceId,
        kpiCode: dto.kpiCode,
        actorId: actor.id,
      },
      'Computing financial KPI snapshot',
    );
    const computedAt = dto.computedAt ? new Date(dto.computedAt) : new Date();

    return this.em.transactional(async (tx) => {
      const existing = await this.kpiRepo.findExisting(
        tx,
        dto.practiceId,
        dto.kpiCode,
        computedAt,
        dto.fiscalPeriodId,
      );
      if (existing) {
        throw new ConflictException(
          'El snapshot de KPI ya fue calculado para esa marca',
          {
            kpiCode: dto.kpiCode,
            computedAt: computedAt.toISOString(),
          },
        );
      }

      const snapshot = this.kpiRepo.create(tx, {
        practiceId: dto.practiceId,
        fiscalPeriodId: dto.fiscalPeriodId,
        kpiCode: dto.kpiCode,
        valueNumeric: dto.valueNumeric,
        dimensionJson: dto.dimensionJson,
        computedAt,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'billing.kpi.compute',
          snapshotId: snapshot.id,
          kpiCode: dto.kpiCode,
        },
        'Financial KPI snapshot recorded',
      );
      return {
        id: snapshot.id,
        kpiCode: snapshot.kpiCode,
        valueNumeric: snapshot.valueNumeric,
        recordedAt: snapshot.recordedAt,
      };
    });
  }
}
