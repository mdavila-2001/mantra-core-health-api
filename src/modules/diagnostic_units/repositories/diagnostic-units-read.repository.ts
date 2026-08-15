import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSites } from '../../practice/entities';
import { CatalogConcepts } from '../../terminology/entities';
import {
  DiagnosticEquipment,
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnitAccreditations,
  DiagnosticUnitSites,
  DiagnosticUnits,
} from '../entities';
import { DUNIT } from '../diagnostic_units.concepts';

/** Consultas que componen las dos lecturas públicas del módulo 23. */
@Injectable()
export class DiagnosticUnitsReadRepository {
  /** Unidades activas y verificadas del tenant activo. */
  findVisibleByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<DiagnosticUnits[]> {
    return em.find(
      DiagnosticUnits,
      {
        tenantId,
        statusConceptId: DUNIT.UNIT_ACTIVE,
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
      },
      { orderBy: { name: 'ASC' } },
    );
  }

  /** Detalle con el mismo filtro de publicación y aislamiento que el listado. */
  findVisibleById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<DiagnosticUnits | null> {
    return em.findOne(DiagnosticUnits, {
      id,
      tenantId,
      statusConceptId: DUNIT.UNIT_ACTIVE,
      verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
    });
  }

  findActiveSites(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<DiagnosticUnitSites[]> {
    if (unitIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticUnitSites,
      {
        diagnosticUnitId: { $in: unitIds },
        statusConceptId: DUNIT.SITE_ACTIVE,
      },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  findEquipment(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<DiagnosticEquipment[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticEquipment,
      { diagnosticUnitSiteId: { $in: siteIds } },
      { orderBy: { manufacturer: 'ASC', model: 'ASC' } },
    );
  }

  findActiveOfferings(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<DiagnosticStudyOfferings[]> {
    if (unitIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticStudyOfferings,
      {
        diagnosticUnitId: { $in: unitIds },
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      },
      { orderBy: { displayName: 'ASC' } },
    );
  }

  findCurrentPublicSchedules(
    em: EntityManager,
    unitId: string,
    now: Date,
  ): Promise<DiagnosticPriceSchedules[]> {
    return em.find(DiagnosticPriceSchedules, {
      diagnosticUnitId: unitId,
      publicVisibility: true,
      statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
      ],
    });
  }

  findCurrentPrices(
    em: EntityManager,
    scheduleIds: readonly string[],
    offeringIds: readonly string[],
    now: Date,
  ): Promise<DiagnosticStudyPrices[]> {
    if (scheduleIds.length === 0 || offeringIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(DiagnosticStudyPrices, {
      priceScheduleId: { $in: scheduleIds },
      diagnosticStudyOfferingId: { $in: offeringIds },
      statusConceptId: DUNIT.PRICE_ACTIVE,
      effectiveFrom: { $lte: now },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gt: now } }],
    });
  }

  findCurrentAccreditations(
    em: EntityManager,
    unitId: string,
    now: Date,
  ): Promise<DiagnosticUnitAccreditations[]> {
    return em.find(
      DiagnosticUnitAccreditations,
      {
        diagnosticUnitId: unitId,
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
        $and: [
          { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
          { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
        ],
      },
      { orderBy: { validTo: 'DESC' } },
    );
  }

  findPracticeSites(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PracticeSites[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PracticeSites, { id: { $in: ids } });
  }

  findConcepts(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<CatalogConcepts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CatalogConcepts, { id: { $in: ids } });
  }
}
