import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  getCurrentTenantId,
} from '../../../../common';
import type { CareSpaces } from '../../entities';
import {
  CareSpaceOpsRepository,
  CareSpacesRepository,
  PracticeSitesRepository,
} from '../../repositories';
import { availabilityFromBlocks } from '../../domain/ops/availability-rules';
import {
  BLOCK_KIND,
  codeFor,
  DEFAULT_TYPE_FOR_TRIGGER,
} from '../../domain/ops/ops-catalog';
import { effectiveCleaningType } from '../../domain/ops/cleaning-rules';
import { codeOf } from '../structure-input';
import type {
  CareSpaceOperationalState,
  CareSpaceOpsPort,
  DirtyTrigger,
  OpsActorContext,
} from '../care-space-ops.port';
import { CareSpaceOpsCore } from './care-space-ops-core';
import { opsError } from './ops-errors';

/**
 * Implementación de `CareSpaceOpsPort` sobre el núcleo de F2. Corre en la
 * transacción del llamador; un espacio de otro tenant (o inexistente) es 404.
 */
@Injectable()
export class PracticeCareSpaceOpsAdapter implements CareSpaceOpsPort {
  /**
   * @param core - Núcleo de operación.
   * @param spacesRepo - Espacios.
   * @param sitesRepo - Sedes.
   * @param opsRepo - Lecturas de operación.
   */
  constructor(
    private readonly core: CareSpaceOpsCore,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly opsRepo: CareSpaceOpsRepository,
  ) {}

  /** @inheritdoc */
  async getOperationalState(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceOperationalState> {
    const { space, practiceId } = await this.load(tx, careSpaceId);
    const snap = await this.core.snapshot(tx, space, practiceId);
    return {
      careSpaceId: space.id,
      tenantId: space.tenantId,
      practiceSiteId: space.practiceSiteId,
      practiceId,
      formCode: codeOf(space.formConceptId),
      functionCode: codeOf(space.spaceTypeConceptId),
      lifecycle: snap.axes.lifecycle,
      availability: snap.axes.availability,
      hygiene: snap.axes.hygiene,
      isolation: snap.axes.isolation,
      occupancy: snap.axes.occupancy,
      terminalCleaningRequired: snap.axes.terminalCleaningRequired,
      v2Code: snap.v2Code,
      assignable: snap.assignable,
      violations: snap.violations,
      opsVersion: space.opsVersion,
      bedCategoryConceptId: space.bedCategoryConceptId ?? null,
      prepMinutes: space.prepMinutes ?? null,
      cleanupMinutes: space.cleanupMinutes ?? null,
    };
  }

  /** @inheritdoc */
  async markDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    input: OpsActorContext & {
      trigger: DirtyTrigger;
      sourceRefId: string;
      terminal: boolean;
    },
  ): Promise<{ cleaningOrderId: string }> {
    await this.core.lock(tx, [careSpaceId]);
    const { space, practiceId } = await this.load(tx, careSpaceId);
    const terminal = input.terminal || space.terminalCleaningRequired === true;
    if (input.terminal && !space.terminalCleaningRequired) {
      await this.core.updateOps(
        tx,
        space,
        { terminalCleaningRequired: true },
        input.actor?.id,
      );
    }
    const ctx = {
      actor: input.actor,
      requestId: input.requestId,
      source:
        input.trigger === 'CLN_TRG_OR_TURNOVER'
          ? ('ROOM_EVENT' as const)
          : ('ADT' as const),
      sourceRefId: input.sourceRefId,
    };
    const type =
      input.trigger === 'CLN_TRG_OR_TURNOVER' && !terminal
        ? 'CLEAN_OR_TURNOVER'
        : effectiveCleaningType(
            DEFAULT_TYPE_FOR_TRIGGER[input.trigger],
            terminal,
          );
    const { order } = await this.core.openCleaningOrder(
      tx,
      space,
      practiceId,
      {
        type,
        trigger: input.trigger,
        priority:
          input.trigger === 'CLN_TRG_OR_TURNOVER'
            ? 'CLN_PRIO_URGENT'
            : 'CLN_PRIO_ROUTINE',
        sourceRefId: input.sourceRefId,
      },
      ctx,
      { escalateOpen: true, reuseOpen: true },
    );
    return { cleaningOrderId: order.id };
  }

  /** @inheritdoc */
  async recordOccupancyChange(
    tx: EntityManager,
    careSpaceId: string,
    input: OpsActorContext & {
      from: 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';
      to: 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';
      sourceRefId: string;
    },
  ): Promise<void> {
    const { space, practiceId } = await this.load(tx, careSpaceId);
    await this.core.changeAxis(
      tx,
      space,
      practiceId,
      'OCCUPANCY',
      input.to,
      {
        actor: input.actor,
        requestId: input.requestId,
        source: 'ADT',
        sourceRefId: input.sourceRefId,
        fromCode: input.from,
      },
      {
        code: input.to,
        since: new Date(),
        encounterId: null,
        locationId: input.sourceRefId,
      },
    );
  }

  /** @inheritdoc */
  async assertBookable(
    tx: EntityManager,
    careSpaceId: string,
    window: { start: Date; end: Date },
  ): Promise<void> {
    const { space } = await this.load(tx, careSpaceId);
    const snapAxes = this.core.axesOf(space, 'OCC_FREE', window.start);
    if (snapAxes.lifecycle !== 'ACTIVE' || !snapAxes.inValidity) {
      throw opsError('SPACE_NOT_BOOKABLE', { lifecycle: snapAxes.lifecycle });
    }
    const blocks = await this.opsRepo.openBlocks(tx, space.id);
    const hit = blocks.find(
      (b) =>
        b.startsAt < window.end && (!b.endedAt || b.endedAt > window.start),
    );
    if (hit) {
      const kind = codeFor(BLOCK_KIND, hit.kindConceptId);
      throw opsError('SPACE_NOT_BOOKABLE', {
        block: {
          id: hit.id,
          kind: kind ?? null,
          availability: kind ? availabilityFromBlocks([kind]) : null,
          startsAt: hit.startsAt.toISOString(),
          expectedEndAt: hit.expectedEndAt?.toISOString() ?? null,
        },
      });
    }
  }

  /** @inheritdoc */
  lockSpaces(
    tx: EntityManager,
    careSpaceIds: readonly string[],
  ): Promise<void> {
    return this.core.lock(tx, careSpaceIds);
  }

  private async load(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<{ space: CareSpaces; practiceId: string }> {
    const space = await this.spacesRepo.findById(tx, careSpaceId);
    const tenantId = getCurrentTenantId();
    if (!space || (tenantId && space.tenantId !== tenantId)) {
      throw new ResourceNotFoundException('Espacio no encontrado', {
        spaceId: careSpaceId,
      });
    }
    const site = await this.sitesRepo.findById(tx, space.practiceSiteId);
    if (!site) throw new ResourceNotFoundException('Sitio no encontrado');
    return { space, practiceId: site.practiceId };
  }
}
