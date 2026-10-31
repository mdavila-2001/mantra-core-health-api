import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import { CLIN } from '../../clinical.concepts';
import {
  EncounterLocations,
  Encounters,
  PlacementIncidents,
} from '../../entities';
import {
  judgePlacement,
  type Violation,
} from '../../domain/inpatient/bed-compatibility';
import { AuthzClinicalScopeService } from '../../../authz/services/authz-clinical-scope.service';
import { findPractitionerNames } from '../../../profiles/infrastructure/read-models/practitioner-names';
import { PRAC } from '../../../practice/practice.concepts';
import { AdtSupport, type AdtRequest } from './adt-support';
import { ClinicalReadService } from '../clinical-read.service';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { locationView } from './adt.use-cases';

/**
 * Lecturas de internación (§F3.3): compatibilidad en vivo, ficha de la
 * estancia y censo vivo de la sede. Sin datos de paciente salvo el id del
 * perfil (la ficha clínica la sirve el expediente).
 */
/** Respuesta de compatibilidad: veredicto, reglas (código, severidad, forzable) y violaciones. */
function compatibilityView(violations: Violation[]) {
  return {
    assignable: judgePlacement(violations).ok,
    rules: violations.map((v) => ({
      code: v.rule,
      severity: v.severity,
      overridable: v.severity === 'OVERRIDABLE',
      detail: v.detail,
    })),
    violations,
  };
}

@Injectable()
export class InpatientReadUseCases {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly support: AdtSupport,
    private readonly clinicalRead: ClinicalReadService,
    private readonly patients: AuthzClinicalScopeService,
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
    return compatibilityView(violations);
  }

  /**
   * `POST /clinical/bed-compatibility`: evaluación prospectiva, sin encuentro
   * (paso «Cama» del ingreso). Las mismas reglas que el ingreso
   * (`AdtSupport.compatibilityFor`); el paciente tiene que ser del tenant
   * (404) y el actor poder colocar en esa cama (`f3.adt.place`, 403/404).
   *
   * @param input - Cama, paciente, nivel de cuidado y aislamiento.
   * @param req - Actor y tenant.
   */
  async prospectiveCompatibility(
    input: {
      careSpaceId: string;
      patientProfileId: string;
      levelOfCareCode?: string;
      isolationPrecautionCode?: string;
      isolationOrganismText?: string;
    },
    req: AdtRequest,
  ) {
    const em = this.em.fork();
    await this.access.assertCan(
      req.actor as never,
      'f3.adt.place',
      { careSpaceId: input.careSpaceId },
      em,
      req.tenantId,
    );
    if (
      !(await this.patients.isPatientInTenant(
        em,
        input.patientProfileId,
        req.tenantId,
      ))
    ) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        patientProfileId: input.patientProfileId,
      });
    }
    const { violations } = await this.support.compatibilityFor(
      em,
      {
        encounterId: null,
        patientProfileId: input.patientProfileId,
        isolation: input.isolationPrecautionCode ?? 'ISO_NONE',
        organism: input.isolationOrganismText ?? null,
        levelOfCare: input.levelOfCareCode ?? null,
      },
      input.careSpaceId,
    );
    return compatibilityView(violations);
  }

  /**
   * `GET /clinical/encounters/:id/stay`.
   *
   * @param encounterId - Encuentro.
   * @param req - Actor y tenant.
   */
  async currentStayOfPatient(patientProfileId: string, req: AdtRequest) {
    // Revisión de seguridad: nada del estado del paciente (existe, internado,
    // no internado) se revela antes de autorizar. Sin permiso, paciente
    // inexistente, no internado o estancia no autorizada responden el MISMO
    // 404 genérico.
    const em = this.em.fork();
    const notFound = () =>
      new ResourceNotFoundException('Estancia no encontrada');
    const actor = req.actor as never as AuthenticatedUser;
    if (
      !(await this.access.canAnywhere(em, actor, req.tenantId, 'f3.adt.read'))
    )
      throw notFound();
    if (
      !(await this.patients.isPatientInTenant(
        em,
        patientProfileId,
        req.tenantId,
      ))
    )
      throw notFound();
    try {
      await this.clinicalRead.assertCanReadHistory(patientProfileId, actor);
    } catch {
      throw notFound();
    }
    const [row] = await em.execute<{ id: string }[]>(
      `SELECT id FROM clinical.encounters
        WHERE patient_profile_id = ? AND tenant_id = ? AND class_concept_id = ? AND status_concept_id = ?
        ORDER BY start_at DESC NULLS LAST, id LIMIT 1`,
      [
        patientProfileId,
        req.tenantId,
        CLIN.ENCOUNTER_CLASS_INPATIENT,
        CLIN.ENCOUNTER_IN_PROGRESS,
      ],
      'all',
    );
    if (!row) throw notFound();
    try {
      // La ficha se autoriza igual que `GET /clinical/encounters/:id/stay`.
      return await this.stay(row.id, req);
    } catch (error) {
      const status = (error as { getStatus?: () => number }).getStatus?.();
      if (status === 403 || status === 404) throw notFound();
      throw error;
    }
  }

  /**
   * `GET /sites/:siteId/attending-practitioners`: profesionales con una
   * asignación de rol vigente en la sede, para «Profesional a cargo» del
   * ingreso. Exige poder colocar en la sede (`f3.adt.place`, 403/404); sólo
   * ids, nombre y especialidad.
   *
   * @param siteId - Sede.
   * @param req - Actor y tenant.
   */
  async attendingPractitioners(siteId: string, req: AdtRequest) {
    const em = this.em.fork();
    const { target } = await this.access.assertCan(
      req.actor as never,
      'f3.adt.place',
      { siteId },
      em,
      req.tenantId,
    );
    const rows = await em.execute<
      {
        practitioner_profile_id: string;
        specialty_code: string | null;
        specialty_display: string | null;
      }[]
    >(
      `SELECT DISTINCT ON (a.practitioner_profile_id)
              a.practitioner_profile_id, sp.code AS specialty_code, sp.display AS specialty_display
         FROM practice.practitioner_role_assignments a
         LEFT JOIN terminology.catalog_concepts sp ON sp.id = a.specialty_concept_id
        WHERE a.practice_id = ? AND (a.practice_site_id = ? OR a.practice_site_id IS NULL)
          AND a.status_concept_id = ?
          AND (a.valid_from IS NULL OR a.valid_from <= now())
          AND (a.valid_to IS NULL OR a.valid_to > now())
        ORDER BY a.practitioner_profile_id, a.is_primary DESC NULLS LAST
        LIMIT 500`,
      [target.site.practiceId, siteId, PRAC.ROLE_ASSIGNMENT_ACTIVE],
      'all',
    );
    const names = await findPractitionerNames(
      em,
      rows.map((r) => r.practitioner_profile_id),
    );
    return rows
      .map((r) => ({
        practitionerProfileId: r.practitioner_profile_id,
        displayName: names.get(r.practitioner_profile_id) ?? '',
        specialty: r.specialty_code
          ? {
              code: r.specialty_code,
              display: r.specialty_display ?? r.specialty_code,
            }
          : null,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

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
    await this.authorizeStay(em, encounter, movements, req);
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
   * Autoriza la ficha de estancia **siempre** (revisión de seguridad de F3):
   * cada espacio distinto de sus movimientos con `f3.adt.read`; un movimiento
   * sin espacio exige rol de nivel sede en su sede; un encuentro sin
   * movimientos exige rol de nivel sede en **todas** las sedes de su sucursal
   * (sin sucursal o sin sedes: 404). Un encuentro que no es de internación
   * exige además la lectura clínica del expediente.
   */
  private async authorizeStay(
    em: EntityManager,
    encounter: Encounters,
    movements: readonly EncounterLocations[],
    req: AdtRequest,
  ): Promise<void> {
    const spaces = [
      ...new Set(
        movements.map((m) => m.careSpaceId).filter((x): x is string => !!x),
      ),
    ];
    for (const careSpaceId of spaces) {
      await this.access.assertCan(
        req.actor as never,
        'f3.adt.read',
        { careSpaceId },
        em,
        req.tenantId,
      );
    }
    const siteIds = [
      ...new Set(
        movements.filter((m) => !m.careSpaceId).map((m) => m.practiceSiteId),
      ),
    ];
    if (movements.length === 0) {
      // El encuentro no guarda su sede: sin una sede exacta, se exige leer
      // TODAS las sedes de su sucursal (nunca una cualquiera); sin sucursal o
      // sin sedes, se deniega (revisión de seguridad F3).
      const rows = encounter.branchId
        ? await em.execute<{ id: string }[]>(
            'SELECT id FROM practice.practice_sites WHERE branch_id = ? AND tenant_id = ? ORDER BY id',
            [encounter.branchId, req.tenantId],
            'all',
          )
        : [];
      if (rows.length === 0) {
        throw new ResourceNotFoundException('Encuentro no encontrado', {
          encounterId: encounter.id,
        });
      }
      siteIds.push(...rows.map((r) => r.id));
    }
    for (const siteId of siteIds) {
      const { target, scope } = await this.access.assertCan(
        req.actor as never,
        'f3.adt.read',
        { siteId },
        em,
        req.tenantId,
      );
      this.access.decide(
        'f3.adt.read',
        this.access.siteLevelRoles(scope, target.site),
        false,
        scope,
      );
    }
    if (encounter.classConceptId !== CLIN.ENCOUNTER_CLASS_INPATIENT) {
      await this.clinicalRead.assertCanReadHistory(
        encounter.patientProfileId,
        req.actor as never,
      );
    }
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
    const { target, scope } = await this.access.assertCan(
      req.actor as never,
      'f3.adt.read',
      { siteId },
      em,
      req.tenantId,
    );
    const allowed = (u: string | null | undefined) =>
      this.access.canOnUnit('f3.adt.read', scope, target.site, u ?? null);
    const filter = await this.access.scopeFilter(
      req.actor as never,
      'f3.adt.read',
      siteId,
      em,
      req.tenantId,
    );
    this.access.assertTargetInScope(filter, { unitId });
    const all = await em.find(EncounterLocations, {
      practiceSiteId: siteId,
      isBedAssignment: true,
      locationStatusConceptId: CLIN.LOCATION_ACTIVE,
      periodEnd: null,
      ...(unitId ? { clinicalUnitId: unitId } : {}),
    });
    const locations = all.filter((l) => allowed(l.clinicalUnitId));
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
