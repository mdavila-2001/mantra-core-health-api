import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  SpaceUnitAssignmentsRepository,
  StructureRulesRepository,
} from '../repositories';
import type {
  CareSpaceDetailDto,
  InfrastructureCatalogDto,
  SiteStructureDto,
} from '../dto';
import {
  CONCEPT_GROUPS,
  FORM_CODES,
  FORM_FHIR_CODE,
  FUNCTION_PROFILES,
  PRACTICE_CONCEPT_BY_CODE,
  ROOT_FORMS,
  SPACE_LIFECYCLE_CODES,
  UNIT_LIFECYCLE_CODES,
  conceptsByPrefix,
} from '../domain/structure/structure-catalog';
import { StructureAccessService } from './structure-access.service';
import {
  childrenIndex,
  toAssignment,
  toEstablishment,
  toSpaceDetail,
  toSpaceNode,
  toUnitNode,
} from './structure-mapper';

const ref = (code: string) => {
  const c = PRACTICE_CONCEPT_BY_CODE.get(code)!;
  return { code: c.code, display: c.display };
};
const group = (prefix: string, exclude: string[] = []) =>
  conceptsByPrefix(prefix, exclude).map((c) => ({
    code: c.code,
    display: c.display,
  }));

/**
 * Lecturas de la infraestructura (F1, contrato §3): catálogo, árbol de la
 * sede y ficha de un espacio. Leer es de cualquier miembro del tenant.
 */
@Injectable()
export class InfrastructureReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: StructureAccessService,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly assignmentsRepo: SpaceUnitAssignmentsRepository,
    private readonly rulesRepo: StructureRulesRepository,
  ) {}

  /**
   * `GET /practice/infrastructure-catalog`. Las reglas salen de la base (lo
   * que la API aplica); la regla raíz, de la constante (no cabe en la PK).
   */
  async catalog(): Promise<InfrastructureCatalogDto> {
    const [parentRules, typologyRules] = await Promise.all([
      this.rulesRepo.parentRules(this.em),
      this.rulesRepo.typologyRules(this.em),
    ]);
    return {
      forms: FORM_CODES.map((code) => ({
        ...ref(code),
        fhirCode: FORM_FHIR_CODE[code],
      })),
      functions: FUNCTION_PROFILES.map((p) => ({
        ...ref(p.code),
        ...p,
        forms: [...p.forms],
      })),
      parentRules: [
        ...ROOT_FORMS.map((child) => ({ parent: null, child })),
        ...parentRules,
      ],
      typologyRules,
      lifecycle: SPACE_LIFECYCLE_CODES.map(ref),
      unitLifecycle: UNIT_LIFECYCLE_CODES.map(ref),
      attributes: {
        asepsis: group(CONCEPT_GROUPS.asepsis),
        pressure: group(CONCEPT_GROUPS.pressure),
        sex: group(CONCEPT_GROUPS.sex),
        ageGroup: group(CONCEPT_GROUPS.ageGroup),
        bedCategory: group(CONCEPT_GROUPS.bedCategory),
        unitRole: group(CONCEPT_GROUPS.unitRole),
      },
      regulatory: {
        subsector: group(CONCEPT_GROUPS.subsector),
        careLevel: group(CONCEPT_GROUPS.careLevel),
        typology: group(CONCEPT_GROUPS.typology),
        sedes: group(CONCEPT_GROUPS.sedes),
        licenseStatus: group(CONCEPT_GROUPS.licenseStatus),
        capacityKind: group(CONCEPT_GROUPS.capacityKind),
      },
    };
  }

  /** `GET /sites/:siteId/structure`: árbol plano con `parentId`. */
  async structure(
    siteId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SiteStructureDto> {
    const site = await this.access.requireSite(this.em, siteId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    const [spaces, units] = await Promise.all([
      this.spacesRepo.findBySite(this.em, siteId),
      this.unitsRepo.findBySite(this.em, siteId),
    ]);
    const assignments = await this.assignmentsRepo.findCurrentBySpaces(
      this.em,
      spaces.map((s) => s.id),
    );
    const children = childrenIndex(spaces);
    const byCode = (a: { code: string }, b: { code: string }) =>
      a.code.localeCompare(b.code);
    return {
      site: toEstablishment(
        site,
        await this.access.canWriteSite(this.em, site, actor),
      ),
      spaces: [...spaces].sort(byCode).map((s) => toSpaceNode(s, children)),
      units: [...units].sort(byCode).map((u) => toUnitNode(u, units)),
      assignments: assignments.map(toAssignment),
      asOf: new Date().toISOString(),
    };
  }

  /** `GET /care-spaces/:id`. */
  async spaceDetail(
    spaceId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CareSpaceDetailDto> {
    const space = await this.access.requireSpace(this.em, spaceId, tenantId);
    await this.access.assertCanRead(this.em, tenantId, actor);
    const siteSpaces = await this.spacesRepo.findBySite(
      this.em,
      space.practiceSiteId,
    );
    const assignments = await this.assignmentsRepo.findCurrentBySpaces(
      this.em,
      [space.id],
    );
    return toSpaceDetail(space, siteSpaces, assignments);
  }
}
