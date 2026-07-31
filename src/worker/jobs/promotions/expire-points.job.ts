import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const EXPIRE_POINTS_INTERVAL_MS = 900_000;
const PROGRAM_LIMIT = 100;

/** Refleja `ActiveLoyaltyProgramSummaryDto`. */
interface ActiveLoyaltyProgramSummary {
  id: string;
  code: string;
}

/** Refleja `ListActiveLoyaltyProgramsResponseDto`. */
interface ListActiveLoyaltyProgramsResponse {
  programs: ActiveLoyaltyProgramSummary[];
}

/** Refleja `ExpirePointsResponseDto`. */
interface ExpirePointsResponse {
  scanned: number;
  affected: number;
  pointsExpired: string;
}

/**
 * Fase 3 · UC-51-06: barre los puntos vencidos de cada programa de lealtad
 * activo. A diferencia del resto de barridos de este plan, `expire-points`
 * exige un `loyaltyProgramId` puntual, así que este job primero descubre los
 * programas activos (`GET /loyalty/programs`, añadido junto con este worker
 * porque no existía) y luego barre cada uno.
 */
@Injectable()
export class ExpirePointsJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExpirePointsJob.name);
  }

  @Interval(EXPIRE_POINTS_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.promotions.expire-points', async () => {
      const active = await this.api.get<ListActiveLoyaltyProgramsResponse>(
        '/loyalty/programs',
        { limit: PROGRAM_LIMIT },
      );

      for (const program of active.programs) {
        await runTick(this.logger, 'worker.promotions.expire-points', () =>
          this.expireProgram(program),
        );
      }
    });
  }

  private async expireProgram(
    program: ActiveLoyaltyProgramSummary,
  ): Promise<void> {
    const result = await this.api.post<ExpirePointsResponse>(
      '/loyalty/jobs/expire-points',
      { loyaltyProgramId: program.id },
    );
    if (result.affected === 0) return;

    this.logger.info(
      {
        operation: 'worker.promotions.expire-points',
        loyaltyProgramId: program.id,
        code: program.code,
        affected: result.affected,
        pointsExpired: result.pointsExpired,
      },
      'Expired loyalty points for program',
    );
  }
}
