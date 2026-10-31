import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { AUD } from '../../../../audit/audit.concepts';
import { CareSpaceBlocks, CareSpaces } from '../../../entities';
import { PRAC } from '../../../practice.concepts';
import { CareSpaceOpsRepository } from '../../../repositories';
import type { IsolationChangeDto, IsolationResultDto } from '../../../dto';
import { judgeIsolationCapability } from '../../../domain/ops/availability-rules';
import { BLOCK_KIND } from '../../../domain/ops/ops-catalog';
import { codeOf } from '../../structure-input';
import { InfrastructureAccessService } from '../../infrastructure-access.service';
import { CareSpaceOpsCore } from '../care-space-ops-core';
import { OpsCellBuilder } from '../ops-cell-builder';
import { assertIfMatchOps, enforce, flushInfra, opsError } from '../ops-errors';
import {
  ChangeAvailabilityUseCase,
  type OpsRequest,
} from './change-availability.use-case';

/**
 * `POST /care-spaces/:id/isolation` (§F2.3).
 *
 * - Exige motivo (422 `ISOLATION_REASON_REQUIRED`) y capacidad del espacio o de
 *   su habitación (422 `ISOLATION_ROOM_NOT_CAPABLE` con `details.missing`).
 * - En una habitación compartida, las camas hermanas **libres** reciben
 *   `BLOCK_CLINICAL` + `BLOCK_RSN_ISOLATION_COHORT`, salvo cohorte avalada
 *   (`cohortApproved`, que exige control de infecciones: 403
 *   `ISOLATION_COHORT_REQUIRES_APPROVAL`).
 * - Al pasar a `ISO_NONE`: `terminal_cleaning_required=true` + orden TERMINAL
 *   (`CLN_TRG_ISOLATION_END`) y se terminan los bloqueos de cohorte.
 */
@Injectable()
export class ChangeIsolationUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly core: CareSpaceOpsCore,
    private readonly opsRepo: CareSpaceOpsRepository,
    private readonly availability: ChangeAvailabilityUseCase,
    private readonly cells: OpsCellBuilder,
  ) {}

  /**
   * @param spaceId - Espacio.
   * @param dto - Aislamiento pedido.
   * @param ifMatchOps - `If-Match-Ops`.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    spaceId: string,
    dto: IsolationChangeDto,
    ifMatchOps: string | undefined,
    req: OpsRequest,
  ): Promise<IsolationResultDto> {
    return this.em.transactional(async (tx) => {
      const { target, roles } = await this.access.assertCan(
        req.actor,
        'f2.isolation.set',
        { careSpaceId: spaceId },
        tx,
        req.tenantId,
      );
      if (!dto.reasonText?.trim()) throw opsError('ISOLATION_REASON_REQUIRED');
      if (
        dto.cohortApproved &&
        !this.access.can('f2.isolation.cohort-approve', roles)
      ) {
        throw opsError('ISOLATION_COHORT_REQUIRES_APPROVAL');
      }
      const space = target.space as CareSpaces;
      const parent = target.chain[1];
      const sharedRoom =
        codeOf(space.formConceptId) === 'LOC_FORM_BED' &&
        parent &&
        codeOf(parent.form_concept_id) === 'LOC_FORM_ROOM';
      const siblings = sharedRoom
        ? (
            await tx.find(CareSpaces, {
              parentSpaceId: parent.id,
              formConceptId: PRAC.LOC_FORM_BED,
              statusConceptId: PRAC.SPACE_ACTIVE,
            })
          ).filter((s) => s.id !== space.id)
        : [];
      // Las camas hermanas reciben (o pierden) el bloqueo de cohorte: también
      // se autorizan, no basta la cama pedida (revisión de seguridad F2).
      for (const sibling of siblings) {
        await this.access.assertCan(
          req.actor,
          'f2.availability.clinical',
          { careSpaceId: sibling.id },
          tx,
          req.tenantId,
        );
      }
      await this.core.lock(tx, [space.id, ...siblings.map((s) => s.id)]);
      await tx.refresh(space);
      assertIfMatchOps(ifMatchOps, space.opsVersion);
      const practiceId = target.site.practiceId;
      const now = new Date();
      const ctx = {
        actor: req.actor,
        requestId: req.requestId,
        source: 'MANUAL' as const,
        reasonText: dto.reasonText,
      };
      const companionBlocks: { careSpaceId: string; blockId: string }[] = [];
      let cleaningOrderId: string | null = null;

      if (dto.isolationCode !== 'ISO_NONE') {
        // La cama hereda la capacidad de su habitación: la función y la
        // presión que importan son las del espacio que tiene HVAC.
        const holder =
          codeOf(space.formConceptId) === 'LOC_FORM_BED' && parent
            ? parent
            : target.chain[0];
        enforce(
          judgeIsolationCapability(
            dto.isolationCode,
            {
              functionCode: codeOf(holder.space_type_concept_id),
              pressureCode: codeOf(holder.pressure_concept_id),
              hvacValidatedOn: holder.hvac_validated_on
                ? new Date(holder.hvac_validated_on)
                : null,
            },
            (await this.core.settings(tx, practiceId)).hvacValidationMaxDays,
            now,
          ),
        );
        await this.core.changeAxis(
          tx,
          space,
          practiceId,
          'ISOLATION',
          dto.isolationCode,
          {
            ...ctx,
            patch: { isolationOrganismText: dto.organismText ?? null },
          },
        );
        if (!dto.cohortApproved) {
          const occupied = await this.core.occupancy(
            tx,
            siblings.map((s) => s.id),
          );
          for (const sibling of siblings) {
            if (occupied.has(sibling.id)) continue;
            const open = await this.opsRepo.openBlocks(tx, sibling.id);
            if (open.length > 0) continue;
            const block = tx.create(
              CareSpaceBlocks,
              {
                tenantId: sibling.tenantId,
                careSpaceId: sibling.id,
                kindConceptId: BLOCK_KIND.BLOCK_CLINICAL,
                reasonConceptId: PRAC.BLOCK_RSN_ISOLATION_COHORT,
                reasonText: `Cohorte de aislamiento de ${space.code}`,
                startsAt: now,
                createdAt: now,
                updatedAt: now,
                createdByUserId: req.actor.id,
                updatedByUserId: req.actor.id,
              },
              { partial: true },
            );
            await flushInfra(tx);
            await this.core.appendHistory(
              tx,
              'block',
              block,
              AUD.OPERATION_INSERT,
              req.actor.id,
            );
            await this.availability.applyStarted(
              tx,
              block,
              sibling,
              practiceId,
              'BLOCK_CLINICAL',
              'BLOCK_RSN_ISOLATION_COHORT',
              req,
            );
            companionBlocks.push({
              careSpaceId: sibling.id,
              blockId: block.id,
            });
          }
        }
      } else {
        const changed = await this.core.changeAxis(
          tx,
          space,
          practiceId,
          'ISOLATION',
          'ISO_NONE',
          {
            ...ctx,
            patch: {
              isolationOrganismText: null,
              terminalCleaningRequired: true,
            },
          },
        );
        if (changed) {
          const { order } = await this.core.openCleaningOrder(
            tx,
            space,
            practiceId,
            {
              type: 'CLEAN_TERMINAL',
              trigger: 'CLN_TRG_ISOLATION_END',
              sourceRefId: changed.id,
            },
            ctx,
            { escalateOpen: true, reuseOpen: true },
          );
          cleaningOrderId = order.id;
          for (const sibling of siblings) {
            const cohort = (
              await this.opsRepo.openBlocks(tx, sibling.id)
            ).filter(
              (b) => b.reasonConceptId === PRAC.BLOCK_RSN_ISOLATION_COHORT,
            );
            for (const block of cohort) {
              await this.availability.endBlock(
                tx,
                block,
                sibling,
                now,
                req,
                'Fin del aislamiento',
              );
            }
            if (cohort.length > 0) {
              await this.availability.reapply(tx, sibling, practiceId, {
                ...ctx,
                source: 'BLOCK',
                sourceRefId: cohort[0].id,
              });
            }
          }
        }
      }
      await flushInfra(tx);
      return {
        cell: await this.cells.cellFor(
          tx,
          space,
          practiceId,
          roles.has('NURSE'),
        ),
        companionBlocks,
        cleaningOrderId,
      };
    });
  }
}
