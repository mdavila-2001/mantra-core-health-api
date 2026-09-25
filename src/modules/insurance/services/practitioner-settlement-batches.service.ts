import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  requireTenantId,
  sumarDecimales,
  type AuthenticatedUser,
} from '../../../common';
import { PracticeTenantLookupService } from '../../practice/services';
import { DiagnosticUnits } from '../../diagnostic_units/entities';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { Pharmacies } from '../../pharmacy/entities';
import {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  ClaimReversals,
  InsuranceClaimLines,
  InsuranceClaims,
  InsuranceReconciliationBatches,
  InsuranceReconciliationItems,
  PatientExplanationsOfBenefit,
} from '../entities';
import { CatalogConcepts } from '../../terminology/entities';
import { CatalogRepository, SettlementRepository } from '../repositories';
import { INS } from '../insurance.concepts';
import { resolveInsuranceCurrencyCode } from '../insurance-currency';
import {
  LinkedClaimAccessService,
  claimAccessDenied,
} from './linked-claim-access.service';
import {
  inferSettlementCadence,
  resolveSettlementPeriod,
  selectSettlementClaims,
  type PreviouslyIncludedItem,
  type SettlementCadence,
} from './practitioner-settlement-batch';
import type {
  GeneratePractitionerSettlementBatchDto,
  PractitionerSettlementBatchDto,
  PractitionerSettlementBatchListQueryDto,
} from '../dto';

/** La versión no superada por ninguna otra del mismo reclamo (idéntico criterio que `ClaimsReadService.currentVersion`). */
function currentVersionOf(
  versions: readonly ClaimAdjudicationVersions[],
): ClaimAdjudicationVersions | undefined {
  if (versions.length === 0) return undefined;
  const superseded = new Set(
    versions
      .map((version) => version.supersedesVersionId)
      .filter((id): id is string => id != null),
  );
  return versions.find((version) => !superseded.has(version.id)) ?? versions[0];
}

function civilDate(value: Date | string): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

/**
 * Tarea 3 · H8 (MED-E13..E16) — genera y lee lotes periódicos de liquidación
 * al profesional. Ver
 * `docs/contracts/insurer-practitioner-settlement-batches.md`.
 */
@Injectable()
export class PractitionerSettlementBatchesService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SettlementRepository,
    private readonly catalog: CatalogRepository,
    private readonly linkedAccess: LinkedClaimAccessService,
    private readonly practiceLookup: PracticeTenantLookupService,
  ) {}

  /**
   * Genera el lote del período, o devuelve el existente si la clave natural
   * ya se generó (contrato §9, idempotencia). Sólo la administración activa
   * de la aseguradora puede generar.
   */
  async generate(
    dto: GeneratePractitionerSettlementBatchDto,
    actor: AuthenticatedUser,
  ): Promise<{ dto: PractitionerSettlementBatchDto; created: boolean }> {
    return this.em.transactional(async (tx) => {
      await this.linkedAccess.assertInsurer(tx, actor, dto.insuranceCarrierId);
      // El cerrojo se toma DESPUÉS de autorizar y ANTES de leer si ya existe:
      // dos generaciones concurrentes de la misma clave se serializan y la
      // segunda encuentra el trabajo de la primera ya hecho (replay).
      await this.repo.lockSettlementPair(
        tx,
        dto.insuranceCarrierId,
        dto.providerEntityId,
      );

      const period = resolveSettlementPeriod(dto.cadence, dto.periodStart);
      const periodStart = new Date(`${period.periodStart}T00:00:00.000Z`);
      const periodEnd = new Date(`${period.periodEnd}T00:00:00.000Z`);

      const existing = await this.repo.findSettlementBatchByNaturalKey(
        tx,
        dto.insuranceCarrierId,
        dto.providerEntityId,
        periodStart,
        periodEnd,
      );
      if (existing) {
        const items = await this.repo.findSettlementItemsByBatchIds(tx, [
          existing.id,
        ]);
        return {
          dto: await this.toDto(tx, existing, items, dto.cadence),
          created: false,
        };
      }

      const claims = await this.repo.findClaimsByCarrierAndProvider(
        tx,
        dto.insuranceCarrierId,
        dto.providerEntityId,
      );
      const claimIds = claims.map((claim) => claim.id);
      const [lines, versions, reversals, previousItems] = await Promise.all([
        tx.find(InsuranceClaimLines, {
          insuranceClaimId: { $in: claimIds },
        }) as Promise<InsuranceClaimLines[]>,
        tx.find(ClaimAdjudicationVersions, {
          insuranceClaimId: { $in: claimIds },
        }) as Promise<ClaimAdjudicationVersions[]>,
        tx.find(ClaimReversals, {
          insuranceClaimId: { $in: claimIds },
        }) as Promise<ClaimReversals[]>,
        this.repo.findSettlementItemsByClaimIds(tx, claimIds),
      ]);

      const linesByClaimId = new Map<string, InsuranceClaimLines[]>();
      for (const line of lines) {
        const bucket = linesByClaimId.get(line.insuranceClaimId) ?? [];
        bucket.push(line);
        linesByClaimId.set(line.insuranceClaimId, bucket);
      }
      const versionsByClaimId = new Map<string, ClaimAdjudicationVersions[]>();
      for (const version of versions) {
        const bucket = versionsByClaimId.get(version.insuranceClaimId) ?? [];
        bucket.push(version);
        versionsByClaimId.set(version.insuranceClaimId, bucket);
      }
      const currentVersionByClaimId = new Map<
        string,
        ClaimAdjudicationVersions | undefined
      >();
      for (const [claimId, group] of versionsByClaimId) {
        currentVersionByClaimId.set(claimId, currentVersionOf(group));
      }
      const currentVersionIds = [...currentVersionByClaimId.values()]
        .filter((version): version is ClaimAdjudicationVersions => !!version)
        .map((version) => version.id);
      const [adjudications, eobs] = await Promise.all([
        currentVersionIds.length
          ? (tx.find(ClaimLineAdjudications, {
              claimAdjudicationVersionId: { $in: currentVersionIds },
            }) as Promise<ClaimLineAdjudications[]>)
          : Promise.resolve([]),
        currentVersionIds.length
          ? (tx.find(PatientExplanationsOfBenefit, {
              claimAdjudicationVersionId: { $in: currentVersionIds },
              statusConceptId: INS.EOB_PUBLISHED,
            }) as Promise<PatientExplanationsOfBenefit[]>)
          : Promise.resolve([]),
      ]);
      const adjudicationsByVersionId = new Map<
        string,
        ClaimLineAdjudications[]
      >();
      for (const row of adjudications) {
        const bucket =
          adjudicationsByVersionId.get(row.claimAdjudicationVersionId) ?? [];
        bucket.push(row);
        adjudicationsByVersionId.set(row.claimAdjudicationVersionId, bucket);
      }
      const eobByVersionId = new Map<string, PatientExplanationsOfBenefit>();
      for (const row of eobs)
        eobByVersionId.set(row.claimAdjudicationVersionId, row);

      const reversedClaimIds = new Set(
        reversals.map((row) => row.insuranceClaimId),
      );
      const previouslyIncludedItemByClaimId = new Map<
        string,
        PreviouslyIncludedItem
      >();
      const alreadyAdjustedClaimIds = new Set<string>();
      for (const item of previousItems) {
        if (item.statusConceptId === INS.SETTLEMENT_ITEM_INCLUDED) {
          previouslyIncludedItemByClaimId.set(item.insuranceClaimId, {
            id: item.id,
            expectedAmount: item.expectedAmount ?? '0',
          });
        } else if (
          item.statusConceptId === INS.SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT
        ) {
          alreadyAdjustedClaimIds.add(item.insuranceClaimId);
        }
      }

      const selection = selectSettlementClaims({
        claims,
        linesByClaimId,
        currentVersionByClaimId,
        adjudicationsByVersionId,
        eobByVersionId,
        reversedClaimIds,
        previouslyIncludedItemByClaimId,
        alreadyAdjustedClaimIds,
        period,
      });

      const providerTypeConceptId =
        claims.find((claim) => claim.id === selection.included[0]?.claimId)
          ?.billingProviderTypeConceptId ??
        claims[0]?.billingProviderTypeConceptId ??
        INS.BILLING_PROVIDER_TYPE_PRACTICE;

      const batch = this.repo.createBatch(tx, {
        insuranceCarrierId: dto.insuranceCarrierId,
        providerTypeConceptId,
        providerEntityId: dto.providerEntityId,
        periodStart,
        periodEnd,
        totalClaimedAmount: selection.totals.totalBilledAmount,
        totalApprovedAmount: selection.totals.totalApprovedAmount,
        currencyConceptId: selection.currencyConceptId,
        statusConceptId: INS.SETTLEMENT_BATCH_ISSUED,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const row of selection.included) {
        this.repo.createItem(tx, {
          insuranceReconciliationBatchId: batch.id,
          insuranceClaimId: row.claimId,
          claimAdjudicationVersionId: row.adjudicationVersionId,
          expectedAmount: row.totalApprovedAmount,
          statusConceptId: INS.SETTLEMENT_ITEM_INCLUDED,
          actorUserId: actor.id,
        });
      }
      for (const row of selection.reversalAdjustments) {
        const version = currentVersionByClaimId.get(row.claimId);
        // La versión revertida puede no ser la "vigente" post-reversión; se
        // referencia la que estaba vigente cuando se incluyó (o la última
        // conocida). La FK es NOT NULL: siempre hay al menos una versión.
        const versionId =
          version?.id ?? versionsByClaimId.get(row.claimId)?.[0]?.id;
        this.repo.createItem(tx, {
          insuranceReconciliationBatchId: batch.id,
          insuranceClaimId: row.claimId,
          claimAdjudicationVersionId: versionId,
          expectedAmount: row.adjustmentAmount,
          statusConceptId: INS.SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      const carrier = await this.catalog.findCarrier(
        tx,
        dto.insuranceCarrierId,
      );
      const currencyCode = await this.resolveCurrencyCode(
        tx,
        selection.currencyConceptId,
      );
      return {
        created: true,
        dto: {
          id: batch.id,
          insuranceCarrierId: dto.insuranceCarrierId,
          carrierName: carrier?.legalName ?? '',
          providerEntityId: dto.providerEntityId,
          cadence: dto.cadence,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          currencyCode,
          status: 'SETTLEMENT_BATCH_ISSUED',
          generatedAt: batch.createdAt.toISOString(),
          replayed: false,
          totals: selection.totals,
          claims: selection.included.map((row) => ({
            ...row,
            eobPublishedAt: row.eobPublishedAt.toISOString(),
          })),
          excludedClaims: [...selection.excluded],
          reversalAdjustments: await this.reversalAdjustmentsWithBatch(
            tx,
            selection.reversalAdjustments,
          ),
        },
      };
    });
  }

  /**
   * El lote por id. Lo puede ver la administración de la aseguradora dueña, o
   * el tenant del prestador (prácticas activas, unidades diagnósticas activas
   * o farmacias del tenant). Ajeno o inexistente: mismo 403.
   */
  async getById(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerSettlementBatchDto> {
    const em = this.em.fork();
    const batch = await this.repo.findBatch(em, id);
    if (!batch || batch.statusConceptId !== INS.SETTLEMENT_BATCH_ISSUED)
      throw claimAccessDenied();
    await this.assertBatchAccess(em, batch, actor);
    const items = await this.repo.findSettlementItemsByBatchIds(em, [batch.id]);
    return this.toDto(em, batch, items);
  }

  /** `GET /practitioner-settlement-batches`. */
  async list(
    query: PractitionerSettlementBatchListQueryDto,
    actor: AuthenticatedUser,
  ): Promise<{ items: PractitionerSettlementBatchDto[] }> {
    const em = this.em.fork();
    const scope = await this.resolveListScope(
      em,
      actor,
      query.providerEntityId,
    );
    const batches = await this.repo.findSettlementBatches(em, {
      insuranceCarrierId: scope.insuranceCarrierId,
      providerEntityIds: scope.providerEntityIds,
      from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined,
      to: query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined,
    });
    const items = await this.repo.findSettlementItemsByBatchIds(
      em,
      batches.map((batch) => batch.id),
    );
    const itemsByBatchId = new Map<string, InsuranceReconciliationItems[]>();
    for (const item of items) {
      const bucket =
        itemsByBatchId.get(item.insuranceReconciliationBatchId) ?? [];
      bucket.push(item);
      itemsByBatchId.set(item.insuranceReconciliationBatchId, bucket);
    }
    return {
      items: await Promise.all(
        batches.map((batch) =>
          this.toDto(em, batch, itemsByBatchId.get(batch.id) ?? []),
        ),
      ),
    };
  }

  private async assertBatchAccess(
    em: EntityManager,
    batch: InsuranceReconciliationBatches,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      await this.linkedAccess.assertInsurer(
        em,
        actor,
        batch.insuranceCarrierId,
      );
      return;
    } catch {
      // No es la aseguradora dueña: probar del lado del prestador.
    }
    const tenantId = requireTenantId();
    const providerEntityIds = await this.providerEntityIdsForTenant(
      em,
      tenantId,
    );
    if (!providerEntityIds.includes(batch.providerEntityId))
      throw claimAccessDenied();
  }

  private async resolveListScope(
    em: EntityManager,
    actor: AuthenticatedUser,
    providerEntityId: string | undefined,
  ): Promise<{
    insuranceCarrierId?: string;
    providerEntityIds?: readonly string[];
  }> {
    const tenantId = requireTenantId();
    const carrier = await this.catalog.findCarrierByTenantId(em, tenantId);
    if (carrier) return { insuranceCarrierId: carrier.id };
    const providerEntityIds = await this.providerEntityIdsForTenant(
      em,
      tenantId,
    );
    if (providerEntityIds.length === 0)
      throw new ForbiddenException(
        'La organización activa no administra una aseguradora ni tiene prácticas, unidades diagnósticas o farmacias activas',
      );
    if (providerEntityId && !providerEntityIds.includes(providerEntityId))
      throw claimAccessDenied();
    return {
      providerEntityIds: providerEntityId
        ? [providerEntityId]
        : providerEntityIds,
    };
  }

  /** Prácticas, unidades diagnósticas y farmacias activas del tenant: el alcance completo del prestador. */
  private async providerEntityIdsForTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<string[]> {
    const [practiceIds, units, pharmacies] = await Promise.all([
      this.practiceLookup.findActivePracticeIdsForTenant(tenantId),
      em.find(DiagnosticUnits, {
        tenantId,
        statusConceptId: DUNIT.UNIT_ACTIVE,
      }) as Promise<DiagnosticUnits[]>,
      em.find(Pharmacies, { tenantId }) as Promise<Pharmacies[]>,
    ]);
    return [
      ...practiceIds,
      ...units.map((unit) => unit.id),
      ...pharmacies.map((pharmacy) => pharmacy.id),
    ];
  }

  private async resolveCurrencyCode(
    em: EntityManager,
    currencyConceptId: string | null,
  ): Promise<string | null> {
    if (!currencyConceptId) return null;
    const concept = await em.findOne(CatalogConcepts, {
      id: currencyConceptId,
    });
    return resolveInsuranceCurrencyCode(currencyConceptId, concept?.code);
  }

  private async reversalAdjustmentsWithBatch(
    em: EntityManager,
    adjustments: readonly {
      readonly claimId: string;
      readonly claimIdentifier: string;
      readonly previousItemId: string;
      readonly adjustmentAmount: string;
    }[],
  ): Promise<
    {
      claimId: string;
      claimIdentifier: string;
      previousBatchId: string;
      adjustmentAmount: string;
    }[]
  > {
    if (adjustments.length === 0) return [];
    const previousItems = await em.find(InsuranceReconciliationItems, {
      id: { $in: adjustments.map((row) => row.previousItemId) },
    });
    const batchIdByItemId = new Map(
      previousItems.map((item) => [
        item.id,
        item.insuranceReconciliationBatchId,
      ]),
    );
    return adjustments.map((row) => ({
      claimId: row.claimId,
      claimIdentifier: row.claimIdentifier,
      previousBatchId: batchIdByItemId.get(row.previousItemId) ?? '',
      adjustmentAmount: row.adjustmentAmount,
    }));
  }

  /** Reconstruye el DTO de un lote ya persistido, sumando desde sus ítems. */
  private async toDto(
    em: EntityManager,
    batch: InsuranceReconciliationBatches,
    items: readonly InsuranceReconciliationItems[],
    cadence?: SettlementCadence,
  ): Promise<PractitionerSettlementBatchDto> {
    const included = items.filter(
      (item) => item.statusConceptId === INS.SETTLEMENT_ITEM_INCLUDED,
    );
    const adjustments = items.filter(
      (item) =>
        item.statusConceptId === INS.SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT,
    );
    const [carrier, versions, claims] = await Promise.all([
      this.catalog.findCarrier(em, batch.insuranceCarrierId),
      em.find(ClaimAdjudicationVersions, {
        id: { $in: items.map((item) => item.claimAdjudicationVersionId) },
      }) as Promise<ClaimAdjudicationVersions[]>,
      em.find(InsuranceClaims, {
        id: { $in: items.map((item) => item.insuranceClaimId) },
      }) as Promise<InsuranceClaims[]>,
    ]);
    const versionById = new Map(
      versions.map((version) => [version.id, version]),
    );
    const claimById = new Map(claims.map((claim) => [claim.id, claim]));
    const eobs = await em.find(PatientExplanationsOfBenefit, {
      claimAdjudicationVersionId: { $in: [...versionById.keys()] },
    });
    const eobByVersionId = new Map(
      eobs.map((eob) => [eob.claimAdjudicationVersionId, eob]),
    );
    const currencyCode = await this.resolveCurrencyCode(
      em,
      batch.currencyConceptId ?? null,
    );
    const totals = {
      totalBilledAmount: batch.totalClaimedAmount ?? '0',
      totalApprovedAmount: batch.totalApprovedAmount ?? '0',
      totalPatientAmount: this.sumField(
        included,
        versionById,
        'totalPatientAmount',
      ),
      totalDeniedAmount: this.sumField(
        included,
        versionById,
        'totalDeniedAmount',
      ),
      totalReversalAdjustmentAmount: this.sumAmounts(
        adjustments.map((item) => item.expectedAmount),
      ),
    };
    return {
      id: batch.id,
      insuranceCarrierId: batch.insuranceCarrierId,
      carrierName: carrier?.legalName ?? '',
      providerEntityId: batch.providerEntityId,
      cadence:
        cadence ??
        inferSettlementCadence(
          civilDate(batch.periodStart),
          civilDate(batch.periodEnd),
        ),
      periodStart: civilDate(batch.periodStart),
      periodEnd: civilDate(batch.periodEnd),
      currencyCode,
      status: 'SETTLEMENT_BATCH_ISSUED',
      generatedAt: batch.createdAt.toISOString(),
      replayed: true,
      totals,
      claims: included.map((item) => {
        const version = versionById.get(item.claimAdjudicationVersionId);
        const claim = claimById.get(item.insuranceClaimId);
        const eob = eobByVersionId.get(item.claimAdjudicationVersionId);
        return {
          claimId: item.insuranceClaimId,
          claimIdentifier: claim?.claimIdentifier ?? '',
          adjudicationVersionId: item.claimAdjudicationVersionId,
          adjudicationVersion: version?.adjudicationVersion ?? 0,
          eobPublishedAt: eob?.publishedAt?.toISOString() ?? '',
          totalBilledAmount: item.expectedAmount ?? '0',
          totalApprovedAmount: item.expectedAmount ?? '0',
          totalPatientAmount: version?.totalPatientAmount ?? '0',
          totalDeniedAmount: version?.totalDeniedAmount ?? '0',
          exclusionsCount: 0,
        };
      }),
      excludedClaims: [],
      reversalAdjustments: adjustments.map((item) => ({
        claimId: item.insuranceClaimId,
        claimIdentifier:
          claimById.get(item.insuranceClaimId)?.claimIdentifier ?? '',
        previousBatchId: batch.id,
        adjustmentAmount: item.expectedAmount ?? '0',
      })),
    };
  }

  private sumField(
    items: readonly InsuranceReconciliationItems[],
    versionById: ReadonlyMap<string, ClaimAdjudicationVersions>,
    field: 'totalPatientAmount' | 'totalDeniedAmount',
  ): string {
    return this.sumAmounts(
      items.map(
        (item) =>
          versionById.get(item.claimAdjudicationVersionId)?.[field] ?? '0',
      ),
    );
  }

  private sumAmounts(amounts: readonly (string | null | undefined)[]): string {
    return sumarDecimales(amounts) ?? '0';
  }
}
