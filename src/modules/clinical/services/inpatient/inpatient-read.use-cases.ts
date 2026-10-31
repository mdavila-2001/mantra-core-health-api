import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import { CLIN } from '../../clinical.concepts';
import {
  EncounterLocations,
  Encounters,
  PlacementIncidents,
} from '../../entities';
import { judgePlacement } from '../../domain/inpatient/bed-compatibility';
import { AdtSupport, type AdtRequest } from './adt-support';
import { locationView } from './adt.use-cases';

/**
 * Lecturas de internación (§F3.3): compatibilidad en vivo, ficha de la
 * estancia y censo vivo de la sede. Sin datos de paciente salvo el id del
 * perfil (la ficha clínica la sirve el expediente).
 */
@Injectable()
export class InpatientReadUseCases {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
  ) {}

  /**
   * `POST /clinical/encounters/:id/bed-compatibility`.
   *
   * @param encounterId - Encuentro.
   * @param careSpaceId - Cama candidata.
   * @param req - Actor y tenant.
   */
  async compatibility(
    encounterId: string,
    careSpaceId: string,
    req: AdtRequest,
  ) {
    const em = this.em.fork();
    const encounter = await this.support.encounter(
      em,
      encounterId,
      req.tenantId,
    );
    await this.access.assertCan(
      req.actor as never,
      'f3.adt.read',
      { careSpaceId },
      em,
      req.tenantId,
    );
    const { violations } = await this.support.compatibility(
      em,
      encounter,
      careSpaceId,
    );
    return { assignable: judgePlacement(violations).ok, violations };
  }

  /**
   * `GET /clinical/encounters/:id/stay`.
   *
   * @param encounterId - Encuentro.
   * @param req - Actor y tenant.
   */
  async stay(encounterId: string, req: AdtRequest) {
    const em = this.em.fork();
    const encounter = await this.support.encounter(
      em,
      encounterId,
      req.tenantId,
    );
    const movements = await em.find(
      EncounterLocations,
      { encounterId },
      { orderBy: { periodStart: 'asc', createdAt: 'asc' } },
    );
    const site = movements[0]?.practiceSiteId;
    if (site)
      await this.access.assertCan(
        req.actor as never,
        'f3.adt.read',
        { siteId: site },
        em,
        req.tenantId,
      );
    const incidents = await em.find(PlacementIncidents, { encounterId });
    return {
      encounter: encounterView(encounter),
      movements: movements.map(locationView),
      incidents: incidents.map((i) => ({
        id: i.id,
        encounterLocationId: i.encounterLocationId ?? null,
        careSpaceId: i.careSpaceId,
        violations: i.violationsJson,
        status:
          Object.entries(CLIN).find(
            ([, id]) => id === i.statusConceptId,
          )?.[0] ?? null,
        reviewedAt: i.reviewedAt?.toISOString() ?? null,
      })),
    };
  }

  /**
   * `GET /sites/:siteId/inpatients?unitId`.
   *
   * @param siteId - Sede.
   * @param unitId - Unidad, opcional.
   * @param req - Actor y tenant.
   */
  async inpatients(
    siteId: string,
    unitId: string | undefined,
    req: AdtRequest,
  ) {
    const em = this.em.fork();
    await this.access.assertCan(
      req.actor as never,
      'f3.adt.read',
      { siteId },
      em,
      req.tenantId,
    );
    const locations = await em.find(EncounterLocations, {
      practiceSiteId: siteId,
      isBedAssignment: true,
      locationStatusConceptId: CLIN.LOCATION_ACTIVE,
      periodEnd: null,
      ...(unitId ? { clinicalUnitId: unitId } : {}),
    });
    const encounters = locations.length
      ? await em.find(Encounters, {
          id: { $in: locations.map((l) => l.encounterId) },
        })
      : [];
    const now = Date.now();
    return locations.map((l) => {
      const e = encounters.find((x) => x.id === l.encounterId);
      return {
        encounterId: l.encounterId,
        patientProfileId: e?.patientProfileId ?? null,
        bed: {
          careSpaceId: l.careSpaceId ?? null,
          clinicalUnitId: l.clinicalUnitId ?? null,
        },
        since: l.periodStart?.toISOString() ?? null,
        levelOfCare:
          Object.entries(CLIN).find(
            ([, id]) => id === e?.levelOfCareConceptId,
          )?.[0] ?? null,
        expectedDischargeAt: e?.expectedDischargeAt?.toISOString() ?? null,
        losDays: e?.startAt
          ? Math.max(1, Math.floor((now - e.startAt.getTime()) / 86_400_000))
          : null,
      };
    });
  }
}

/** Encuentro como lo ve la ficha de internación. */
function encounterView(e: Encounters): Record<string, unknown> {
  const code = (id?: string) =>
    Object.entries(CLIN).find(([, v]) => v === id)?.[0] ?? null;
  return {
    id: e.id,
    episodeId: e.episodeId ?? null,
    patientProfileId: e.patientProfileId,
    class: code(e.classConceptId),
    status: code(e.statusConceptId),
    levelOfCare: code(e.levelOfCareConceptId),
    admissionSource: code(e.admissionSourceConceptId),
    dischargeDisposition: code(e.dischargeDispositionConceptId),
    startAt: e.startAt?.toISOString() ?? null,
    endAt: e.endAt?.toISOString() ?? null,
    expectedDischargeAt: e.expectedDischargeAt?.toISOString() ?? null,
    rowVersion: e.rowVersion,
  };
}
