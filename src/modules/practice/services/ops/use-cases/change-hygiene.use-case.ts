import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { CareSpaces } from '../../../entities';
import type { HygieneActionDto, HygieneResultDto } from '../../../dto';
import { effectiveCleaningType } from '../../../domain/ops/cleaning-rules';
import { InfrastructureAccessService } from '../../infrastructure-access.service';
import { CareSpaceOpsCore } from '../care-space-ops-core';
import { OpsCellBuilder } from '../ops-cell-builder';
import { assertIfMatchOps } from '../ops-errors';
import type { OpsRequest } from './change-availability.use-case';

/**
 * `POST /care-spaces/:id/hygiene` (§F2.3). `mark-dirty` abre una orden manual
 * (409 `CLEANING_ORDER_ALREADY_OPEN` si ya hay una); `mark-contaminated` pone
 * la higiene en `HYG_CONTAMINATED`, prende la limpieza terminal y **escala** la
 * orden abierta a TERMINAL en vez de fallar.
 */
@Injectable()
export class ChangeHygieneUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly core: CareSpaceOpsCore,
    private readonly cells: OpsCellBuilder,
  ) {}

  /**
   * @param spaceId - Espacio.
   * @param dto - Acción y motivo.
   * @param ifMatchOps - `If-Match-Ops`.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    spaceId: string,
    dto: HygieneActionDto,
    ifMatchOps: string | undefined,
    req: OpsRequest,
  ): Promise<HygieneResultDto> {
    return this.em.transactional(async (tx) => {
      const { target, roles } = await this.access.assertCan(
        req.actor,
        dto.action === 'mark-dirty'
          ? 'f2.hygiene.mark-dirty'
          : 'f2.hygiene.mark-contaminated',
        { careSpaceId: spaceId },
        tx,
        req.tenantId,
      );
      await this.core.lock(tx, [spaceId]);
      const space = target.space as CareSpaces;
      await tx.refresh(space);
      assertIfMatchOps(ifMatchOps, space.opsVersion);
      const practiceId = target.site.practiceId;
      const ctx = {
        actor: req.actor,
        requestId: req.requestId,
        source: 'MANUAL' as const,
        reasonText: dto.reasonText ?? null,
      };
      let orderId: string;
      if (dto.action === 'mark-dirty') {
        const { order } = await this.core.openCleaningOrder(
          tx,
          space,
          practiceId,
          {
            type: effectiveCleaningType(
              'CLEAN_ROUTINE',
              space.terminalCleaningRequired,
            ),
            trigger: 'CLN_TRG_MANUAL',
          },
          ctx,
        );
        orderId = order.id;
      } else {
        await this.core.changeAxis(
          tx,
          space,
          practiceId,
          'HYGIENE',
          'HYG_CONTAMINATED',
          { ...ctx, patch: { terminalCleaningRequired: true } },
        );
        const { order } = await this.core.openCleaningOrder(
          tx,
          space,
          practiceId,
          {
            type: 'CLEAN_TERMINAL',
            trigger: 'CLN_TRG_CONTAMINATION',
            priority: 'CLN_PRIO_URGENT',
          },
          ctx,
          { escalateOpen: true },
        );
        orderId = order.id;
      }
      const withPatient = roles.has('NURSE') || roles.has('ADMISSION');
      return {
        cell: await this.cells.cellFor(tx, space, practiceId, withPatient),
        cleaningOrderId: orderId,
      };
    });
  }
}
