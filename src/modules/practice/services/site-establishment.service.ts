import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { OutboxService } from '../../messaging/services/outbox.service';
import { FacilityLicensesRepository } from '../../organization_extensions/repositories/facility-licenses.repository';
import { Hospitals } from '../../organization_extensions/entities';
import type { FacilityLicenses } from '../../organization_extensions/entities';
import { ORGEXT } from '../../organization_extensions/organization_extensions.concepts';
import { PRAC } from '../practice.concepts';
import {
  PracticeErrorReason,
  conflict,
  ruleException,
} from '../practice.error-reasons';
import type { PracticeSites } from '../entities';
import { HealthcareServices } from '../entities';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  SiteDeclaredCapacitiesRepository,
  StructureRulesRepository,
} from '../repositories';
import type {
  CreateDeclaredCapacityDto,
  CreateSiteLicenseDto,
  SiteCapacityDto,
  SiteLicenseDto,
  SiteRegulatoryDto,
  UpdateSiteLicenseDto,
  UpdateSiteRegulatoryDto,
} from '../dto';
import {
  PRACTICE_CONCEPT_BY_CODE,
  conceptIdOf,
  conceptRef,
} from '../domain/structure/structure-catalog';
import {
  judgeTypology,
  missingRequiredFunctions,
} from '../domain/structure/structure-rules';
import {
  capacityGaps,
  deriveCapacity,
  effectiveLicenseStatus,
  type LicenseBaseStatus,
} from '../domain/structure/capacity';
import { StructureAccessService } from './structure-access.service';
import { appendStructureRevision } from './structure-history';
import { STRUCTURE_EVENTS, publishStructureEvent } from './structure-events';
import { flushStructure } from './structure-write-errors';
import { isoDate, toEstablishment } from './structure-mapper';
import { checkIfMatchWhenPresent, codeOf, formOf } from './structure-input';

/** Roles de plataforma: verificación SNIS y estado de habilitaciones. */
const PLATFORM_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];

/**
 * Estado de `facility_licenses.verification_status_concept_id` ↔ LIC_*.
 *
 * Orden del orquestador (2026-10-29): las habilitaciones de la sede son
 * `organization_extensions.facility_licenses`, no una tabla nueva. Esa tabla
 * sólo distingue pendiente / verificada / rechazada; vencida se calcula al
 * leer (`valid_to < hoy`) y suspendida no tiene dónde guardarse (desvío).
 */
const BASE_STATUS_BY_VERIFICATION: Record<string, LicenseBaseStatus> = {
  [ORGEXT.LICENSE_PENDING]: 'LIC_IN_PROCESS',
  [ORGEXT.LICENSE_VERIFIED]: 'LIC_VALID',
  [ORGEXT.LICENSE_REJECTED]: 'LIC_REVOKED',
};
const VERIFICATION_BY_STATUS: Record<string, string> = {
  LIC_IN_PROCESS: ORGEXT.LICENSE_PENDING,
  LIC_VALID: ORGEXT.LICENSE_VERIFIED,
  LIC_REVOKED: ORGEXT.LICENSE_REJECTED,
};

/** Columnas regulatorias por campo del DTO y prefijo de su concepto. */
const REGULATORY_CODED = [
  ['subsectorCode', 'subsectorConceptId', 'SUBSECTOR_'],
  ['careLevelCode', 'careLevelConceptId', 'CARE_LEVEL_'],
  ['typologyCode', 'facilityTypologyConceptId', 'TYPOLOGY_'],
  ['sedesCode', 'sedesDepartmentConceptId', 'SEDES_'],
] as const;
const REGULATORY_PLAIN = [
  'managingEntityName',
  'healthNetworkName',
  'municipalityName',
] as const;

/** `YYYY-MM-DD` de hoy (UTC; los vencimientos son fechas, no instantes). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateOrUndefined(v: string | null | undefined): Date | undefined {
  return v ? new Date(`${v}T00:00:00Z`) : undefined;
}

/**
 * El establecimiento regulado (F1, contrato §3 y D5 del PLAN): datos SNIS y
 * de Bolivia, verificación del SNIS por la plataforma, habilitaciones y
 * capacidad declarada vs. derivada.
 *
 * Escribir esto es de nivel organización: OWNER, ADMIN de toda la org o
 * plataforma. El admin de sucursal sólo lo ve (PLAN §3).
 */
@Injectable()
export class SiteEstablishmentService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: StructureAccessService,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly rulesRepo: StructureRulesRepository,
    private readonly capacitiesRepo: SiteDeclaredCapacitiesRepository,
    private readonly licensesRepo: FacilityLicensesRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly outbox: OutboxService,
  ) {}

  // ---------------------------------------------------------- regulatorio

  /**
   * `PATCH /sites/:siteId/regulatory`.
   *
   * Cambiar la tipología valida los espacios no retirados contra las reglas
   * de la nueva: si alguno queda fuera, 409 `TYPOLOGY_CONFLICT` con la lista.
   * Cambiar `snisCode` borra la verificación (lo hace un trigger del modelo);
   * declarar un código no consulta otros tenants (la unicidad global es sólo
   * de los verificados, contrato «Desvíos»).
   */
  async updateRegulatory(
    siteId: string,
    dto: UpdateSiteRegulatoryDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteRegulatoryDto> {
    return this.em.transactional(async (tx) => {
      const site = await this.access.requireSite(tx, siteId, tenantId);
      await this.access.assertCanAdministerOrganization(tx, tenantId, actor);
      checkIfMatchWhenPresent(ifMatch, site.rowVersion);
      const changes: string[] = [];
      const row = site as unknown as Record<string, unknown>;

      for (const [field, column, prefix] of REGULATORY_CODED) {
        const value = dto[field];
        if (value === undefined) continue;
        if (value === null) {
          row[column] = undefined;
        } else {
          const id = conceptIdOf(value, prefix);
          if (!id) {
            throw ruleException(PracticeErrorReason.SPACE_UNKNOWN_CODE, {
              field,
              code: value,
            });
          }
          row[column] = id;
        }
        changes.push(field);
      }
      for (const field of REGULATORY_PLAIN) {
        if (dto[field] === undefined) continue;
        row[field] = dto[field] ?? undefined;
        changes.push(field);
      }
      if (
        dto.snisCode !== undefined &&
        (dto.snisCode ?? undefined) !== site.snisCode
      ) {
        site.snisCode = dto.snisCode ?? undefined;
        changes.push('snisCode');
      }

      const rules = await this.rulesRepo.typologyRules(tx);
      const typologyCode = codeOf(site.facilityTypologyConceptId);
      const spaces = (await this.spacesRepo.findBySite(tx, siteId)).filter(
        (s) => s.statusConceptId !== PRAC.SPACE_RETIRED,
      );
      if (changes.includes('typologyCode')) {
        const conflicts = spaces
          .map((s) => ({ s, fn: codeOf(s.spaceTypeConceptId) ?? '' }))
          .filter(({ fn }) => !judgeTypology(typologyCode, fn, rules).ok)
          .map(({ s, fn }) => ({
            spaceId: s.id,
            code: s.code,
            name: s.name,
            function: conceptRef(s.spaceTypeConceptId),
            functionCode: fn,
          }));
        if (conflicts.length > 0) {
          throw conflict(
            PracticeErrorReason.TYPOLOGY_CONFLICT,
            'Hay espacios que la tipología nueva no admite',
            { typologyCode, conflicts },
          );
        }
      }

      touch(site, actor.id);
      await flushStructure(tx);
      await appendStructureRevision(
        this.historyRepo,
        tx,
        'site',
        site,
        AUD.OPERATION_UPDATE,
        actor.id,
      );
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.siteRegulatoryUpdated,
        {
          tenantId: site.tenantId,
          aggregateId: site.id,
          actorUserId: actor.id,
          payload: { siteId: site.id, changes, rowVersion: site.rowVersion },
        },
      );
      await flushStructure(tx);
      return this.regulatoryView(
        tx,
        site,
        actor,
        spaces.map((s) => codeOf(s.spaceTypeConceptId) ?? ''),
        typologyCode,
        rules,
      );
    });
  }

  /**
   * `POST /sites/:siteId/regulatory/verify-snis`: sólo plataforma.
   *
   * El modelo (v4.2.67b) rechaza con un trigger la escritura de
   * `snis_verified_*` fuera de `app.system_context = 'true'`; se abre ese
   * contexto (SET LOCAL de la transacción) **después** de autorizar y se
   * cierra al terminar. Si el código ya está verificado en otra sede, 409
   * `SNIS_CODE_UNAVAILABLE` sin decir cuál.
   */
  async verifySnis(
    siteId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteRegulatoryDto> {
    if (!PLATFORM_ROLES.some((r) => (actor.roles ?? []).includes(r))) {
      throw new ForbiddenException(
        'Sólo la plataforma verifica el código SNIS',
      );
    }
    return this.em.transactional(async (tx) => {
      const site = await this.access.requireSite(tx, siteId, tenantId);
      if (!site.snisCode) {
        throw ruleException(PracticeErrorReason.SNIS_CODE_MISSING, { siteId });
      }
      await tx.execute("select set_config('app.system_context', 'true', true)");
      // Sin `finally`: si la escritura falla (p. ej. 23505 del SNIS ya
      // verificado), la transacción queda abortada y cualquier sentencia más
      // —incluido este reset— reemplazaría el 409 por un 500. El SET LOCAL
      // muere con el ROLLBACK; sólo hace falta cerrarlo en el camino feliz.
      site.snisVerifiedAt = new Date();
      site.snisVerifiedByUserId = actor.id;
      touch(site, actor.id);
      await flushStructure(tx);
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
      await appendStructureRevision(
        this.historyRepo,
        tx,
        'site',
        site,
        AUD.OPERATION_UPDATE,
        actor.id,
      );
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.siteSnisVerified,
        {
          tenantId: site.tenantId,
          aggregateId: site.id,
          actorUserId: actor.id,
          payload: { siteId: site.id, rowVersion: site.rowVersion },
        },
      );
      await flushStructure(tx);
      const rules = await this.rulesRepo.typologyRules(tx);
      const spaces = await this.spacesRepo.findBySite(tx, siteId);
      return this.regulatoryView(
        tx,
        site,
        actor,
        spaces
          .filter((s) => s.statusConceptId !== PRAC.SPACE_RETIRED)
          .map((s) => codeOf(s.spaceTypeConceptId) ?? ''),
        codeOf(site.facilityTypologyConceptId),
        rules,
      );
    });
  }

  /** `GET /sites/:siteId/regulatory`. */
  async getRegulatory(
    siteId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteRegulatoryDto> {
    const site = await this.access.requireSite(this.em, siteId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    const rules = await this.rulesRepo.typologyRules(this.em);
    const spaces = await this.spacesRepo.findBySite(this.em, siteId);
    return this.regulatoryView(
      this.em,
      site,
      actor,
      spaces
        .filter((s) => s.statusConceptId !== PRAC.SPACE_RETIRED)
        .map((s) => codeOf(s.spaceTypeConceptId) ?? ''),
      codeOf(site.facilityTypologyConceptId),
      rules,
    );
  }

  // -------------------------------------------------------- habilitaciones

  /** `GET /sites/:siteId/licenses`. */
  async listLicenses(
    siteId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteLicenseDto[]> {
    const site = await this.access.requireSite(this.em, siteId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    const rows = await this.licensesRepo.findBySite(
      this.em,
      site.tenantId,
      site.id,
    );
    return rows.map((r) => this.toLicense(r));
  }

  /**
   * `POST /sites/:siteId/licenses`: nace «en trámite»; la vigente la decide
   * la plataforma (mismo criterio que `POST /orgext/facility-licenses/:id/verify`).
   */
  async createLicense(
    siteId: string,
    dto: CreateSiteLicenseDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteLicenseDto> {
    return this.em.transactional(async (tx) => {
      const site = await this.access.requireSite(tx, siteId, tenantId);
      await this.access.assertCanAdministerOrganization(tx, tenantId, actor);
      this.assertNoNotes(dto.notes);
      await this.assertScope(
        tx,
        site,
        dto.clinicalUnitId,
        dto.healthcareServiceId,
      );
      const typeId = ORGEXT.LICENSE_TYPE_OPERATING;
      if (
        await this.licensesRepo.findByNumber(
          tx,
          site.tenantId,
          typeId,
          dto.resolutionNumber,
        )
      ) {
        throw conflict(
          PracticeErrorReason.LICENSE_NUMBER_TAKEN,
          'Ya existe una habilitación con ese número de resolución',
          { field: 'resolutionNumber' },
        );
      }
      const license = this.licensesRepo.create(tx, {
        tenantId: site.tenantId,
        practiceSiteId: site.id,
        facilityTypeConceptId: ORGEXT.FACILITY_TYPE_HOSPITAL,
        licenseTypeConceptId: typeId,
        licenseNumber: dto.resolutionNumber,
        issuingAuthorityName: dto.authorityName,
        validFrom: dateOrUndefined(dto.issuedOn),
        validTo: dateOrUndefined(dto.expiresOn),
        evidenceFileId: dto.documentFileId,
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        clinicalUnitId: dto.clinicalUnitId,
        healthcareServiceId: dto.healthcareServiceId,
        actorUserId: actor.id,
      });
      await flushStructure(tx);
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.licenseCreated,
        {
          tenantId: site.tenantId,
          aggregateId: license.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            licenseId: license.id,
            statusCode: 'LIC_IN_PROCESS',
            rowVersion: license.rowVersion ?? 1,
          },
        },
      );
      await flushStructure(tx);
      return this.toLicense(license);
    });
  }

  /**
   * `PATCH /site-licenses/:id`.
   *
   * Los datos los edita la organización; si edita una habilitación ya
   * verificada, vuelve a «en trámite» (lo que se verificó era otro texto). El
   * estado sólo lo cambia la plataforma.
   */
  async updateLicense(
    licenseId: string,
    dto: UpdateSiteLicenseDto,
    ifMatch: string | undefined,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteLicenseDto> {
    return this.em.transactional(async (tx) => {
      const license = await this.licensesRepo.findById(tx, licenseId);
      if (
        !license ||
        license.tenantId !== tenantId ||
        !license.practiceSiteId
      ) {
        throw new ResourceNotFoundException('Habilitación no encontrada', {
          licenseId,
        });
      }
      const site = await this.access.requireSite(
        tx,
        license.practiceSiteId,
        tenantId,
      );
      await this.access.assertCanAdministerOrganization(tx, tenantId, actor);
      checkIfMatchWhenPresent(ifMatch, license.rowVersion);
      this.assertNoNotes(dto.notes);
      const platform = PLATFORM_ROLES.some((r) =>
        (actor.roles ?? []).includes(r),
      );
      const changes: string[] = [];

      if (dto.authorityName !== undefined) {
        license.issuingAuthorityName = dto.authorityName;
        changes.push('authorityName');
      }
      if (dto.resolutionNumber !== undefined) {
        license.licenseNumber = dto.resolutionNumber;
        changes.push('resolutionNumber');
      }
      if (dto.issuedOn !== undefined) {
        license.validFrom = dateOrUndefined(dto.issuedOn);
        changes.push('issuedOn');
      }
      if (dto.expiresOn !== undefined) {
        license.validTo = dateOrUndefined(dto.expiresOn);
        changes.push('expiresOn');
      }
      if (dto.documentFileId !== undefined) {
        license.evidenceFileId = dto.documentFileId ?? undefined;
        changes.push('documentFileId');
      }

      if (dto.status !== undefined) {
        if (!platform) {
          throw new ForbiddenException(
            'Sólo la plataforma cambia el estado de una habilitación',
          );
        }
        const verification = VERIFICATION_BY_STATUS[dto.status];
        if (!verification) {
          throw ruleException(PracticeErrorReason.LICENSE_STATUS_UNSUPPORTED, {
            status: dto.status,
            supported: Object.keys(VERIFICATION_BY_STATUS),
          });
        }
        license.verificationStatusConceptId = verification;
        changes.push('status');
      } else if (
        changes.length > 0 &&
        !platform &&
        license.verificationStatusConceptId === ORGEXT.LICENSE_VERIFIED
      ) {
        license.verificationStatusConceptId = ORGEXT.LICENSE_PENDING;
        changes.push('status');
      }

      touch(license, actor.id);
      await flushStructure(tx);
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.licenseUpdated,
        {
          tenantId: site.tenantId,
          aggregateId: license.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            licenseId: license.id,
            changes,
            statusCode: this.toLicense(license).status.code,
            rowVersion: license.rowVersion,
          },
        },
      );
      await flushStructure(tx);
      return this.toLicense(license);
    });
  }

  // ------------------------------------------------------------- capacidad

  /**
   * `GET /sites/:siteId/capacity`: declarada (la última vigente por tipo, de
   * `site_declared_capacities`, más `hospitals.licensed_bed_capacity` como
   * `CAP_BEDS_CENSABLE` de origen `hospital` si la sede es la del hospital)
   * vs. derivada (espacios activos contados).
   */
  async capacity(
    siteId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteCapacityDto> {
    const site = await this.access.requireSite(this.em, siteId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    return this.capacityOf(this.em, site);
  }

  /** `POST /sites/:siteId/declared-capacities`. */
  async declareCapacity(
    siteId: string,
    dto: CreateDeclaredCapacityDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteCapacityDto> {
    return this.em.transactional(async (tx) => {
      const site = await this.access.requireSite(tx, siteId, tenantId);
      await this.access.assertCanAdministerOrganization(tx, tenantId, actor);
      const kindId = conceptIdOf(dto.kindCode, 'CAP_');
      if (!kindId) {
        throw ruleException(PracticeErrorReason.SPACE_UNKNOWN_CODE, {
          field: 'kindCode',
          code: dto.kindCode,
        });
      }
      const row = this.capacitiesRepo.create(tx, {
        tenantId: site.tenantId,
        practiceSiteId: site.id,
        capacityKindConceptId: kindId,
        quantity: dto.quantity,
        asOf: new Date(`${dto.asOf}T00:00:00Z`),
        resolutionNumber: dto.resolutionNumber,
        validTo: dateOrUndefined(dto.validTo),
        actorUserId: actor.id,
      });
      await flushStructure(tx);
      await publishStructureEvent(
        this.outbox,
        tx,
        STRUCTURE_EVENTS.siteCapacityDeclared,
        {
          tenantId: site.tenantId,
          aggregateId: site.id,
          actorUserId: actor.id,
          payload: {
            siteId: site.id,
            declaredCapacityId: row.id,
            kindCode: dto.kindCode,
            quantity: dto.quantity,
            asOf: dto.asOf,
          },
        },
      );
      await flushStructure(tx);
      return this.capacityOf(tx, site);
    });
  }

  // --------------------------------------------------------------- apoyo

  private async capacityOf(
    em: EntityManager,
    site: PracticeSites,
  ): Promise<SiteCapacityDto> {
    const now = today();
    const rows = await this.capacitiesRepo.findBySite(em, site.id);
    const latest = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      if (r.validTo && isoDate(r.validTo)! < now) continue;
      if (isoDate(r.asOf)! > now) continue;
      const code = codeOf(r.capacityKindConceptId);
      if (code && !latest.has(code)) latest.set(code, r);
    }
    const declared: SiteCapacityDto['declared'] = [...latest.entries()].map(
      ([kindCode, r]) => ({
        kindCode,
        quantity: r.quantity,
        asOf: isoDate(r.asOf),
        resolutionNumber: r.resolutionNumber ?? null,
        source: 'site',
      }),
    );
    const hospital = await em.findOne(Hospitals, {
      tenantId: site.tenantId,
      practiceId: site.practiceId,
      $or: [
        { primaryPracticeSiteId: site.id },
        { primaryPracticeSiteId: null },
      ],
    });
    if (hospital?.licensedBedCapacity != null) {
      declared.push({
        kindCode: 'CAP_BEDS_CENSABLE',
        quantity: hospital.licensedBedCapacity,
        asOf: null,
        resolutionNumber: null,
        source: 'hospital',
      });
    }
    const spaces = await this.spacesRepo.findBySite(em, site.id);
    const derived = deriveCapacity(
      spaces.map((s) => ({
        formCode: formOf(s),
        functionCode: codeOf(s.spaceTypeConceptId),
        active: s.statusConceptId === PRAC.SPACE_ACTIVE,
        censable: s.censable,
      })),
    );
    // Para la brecha manda lo declarado por la sede; el dato del hospital sólo
    // cuenta para un tipo que la sede no declaró.
    const forGaps = new Map<string, number>();
    for (const d of declared)
      if (!forGaps.has(d.kindCode)) forGaps.set(d.kindCode, d.quantity);
    return {
      declared,
      derived,
      gaps: capacityGaps(
        [...forGaps.entries()].map(([kindCode, quantity]) => ({
          kindCode,
          quantity,
        })),
        derived,
      ),
    };
  }

  private async regulatoryView(
    em: EntityManager,
    site: PracticeSites,
    actor: AuthenticatedUser,
    presentFunctions: string[],
    typologyCode: string | null,
    rules: Awaited<ReturnType<StructureRulesRepository['typologyRules']>>,
  ): Promise<SiteRegulatoryDto> {
    return {
      ...toEstablishment(site, await this.access.canWriteSite(em, site, actor)),
      missingRequiredFunctions: missingRequiredFunctions(
        typologyCode,
        new Set(presentFunctions),
        rules,
      ),
    };
  }

  /** `notes` sólo vacío: `facility_licenses` no tiene la columna (desvío). */
  private assertNoNotes(notes: string | null | undefined): void {
    if (notes?.trim()) {
      throw ruleException(PracticeErrorReason.LICENSE_NOTES_UNSUPPORTED, {
        field: 'notes',
      });
    }
  }

  /** Alcance de la habilitación: unidad y servicio de la misma sede, o 404. */
  private async assertScope(
    tx: EntityManager,
    site: PracticeSites,
    unitId?: string,
    serviceId?: string,
  ): Promise<void> {
    if (unitId) {
      const unit = await this.unitsRepo.findById(tx, unitId);
      if (
        !unit ||
        unit.practiceSiteId !== site.id ||
        unit.tenantId !== site.tenantId
      ) {
        throw new ResourceNotFoundException(
          'Unidad clínica no encontrada',
          { clinicalUnitId: unitId },
          PracticeErrorReason.UNIT_NOT_FOUND,
        );
      }
    }
    if (serviceId) {
      const service = await tx.findOne(HealthcareServices, { id: serviceId });
      if (
        !service ||
        service.practiceId !== site.practiceId ||
        (service.practiceSiteId && service.practiceSiteId !== site.id)
      ) {
        throw new ResourceNotFoundException('Servicio no encontrado', {
          healthcareServiceId: serviceId,
        });
      }
    }
  }

  private toLicense(l: FacilityLicenses): SiteLicenseDto {
    const base =
      BASE_STATUS_BY_VERIFICATION[l.verificationStatusConceptId] ??
      'LIC_IN_PROCESS';
    const code = effectiveLicenseStatus(base, isoDate(l.validTo), today());
    const concept = PRACTICE_CONCEPT_BY_CODE.get(code)!;
    return {
      id: l.id,
      practiceSiteId: l.practiceSiteId!,
      authorityName: l.issuingAuthorityName ?? null,
      resolutionNumber: l.licenseNumber,
      issuedOn: isoDate(l.validFrom),
      expiresOn: isoDate(l.validTo),
      status: conceptRef(concept.id)!,
      clinicalUnitId: l.clinicalUnitId ?? null,
      healthcareServiceId: l.healthcareServiceId ?? null,
      documentFileId: l.evidenceFileId ?? null,
      rowVersion: l.rowVersion,
    };
  }
}
