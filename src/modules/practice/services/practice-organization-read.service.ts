import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import type { CatalogConcepts } from '../../terminology/entities';
import type {
  CareSpaces,
  ClinicalUnits,
  HealthcareServices,
  InventoryItems,
  PracticeAccreditations,
  PracticeSites,
  PractitionerRoleAssignments,
} from '../entities';
import {
  PracticesRepository,
  PracticeOrganizationReadRepository,
} from '../repositories';
import type {
  MedicalOrganizationConsoleDto,
  OrganizationCareSpaceDto,
  OrganizationClinicalUnitDto,
  OrganizationHeaderDto,
  OrganizationHealthcareServiceDto,
  OrganizationInventoryItemDto,
  OrganizationLegalDocumentDto,
  OrganizationSiteDto,
  OrganizationStaffMemberDto,
  PracticeConceptDto,
} from '../dto';

/** Milisegundos de un día, para los días que faltan hasta un vencimiento. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * La lectura de la consola de organización médica (CARRIL 13).
 *
 * ## Por qué existe
 *
 * `practice` tenía **once operaciones de escritura y tres lecturas**: prácticas,
 * sedes y espacios. Áreas, servicios, plantilla, documentación legal e
 * inventario se podían crear y no se podían consultar, así que la organización
 * se administraba a ciegas — el administrador daba de alta un quirófano y el
 * sistema no volvía a mencionarlo nunca.
 *
 * ## Una consulta, un ámbito
 *
 * La práctica es el ámbito de la pantalla, no un filtro: las siete listas
 * cuelgan del mismo `practiceId`, se ven juntas y no tienen sentido por
 * separado. Por eso la lectura es una sola y devuelve el árbol completo.
 *
 * ## Aislamiento por tenant
 *
 * Se comprueba que la práctica pertenezca al tenant del contexto **antes** de
 * leer nada, y una práctica ajena responde el mismo 404 que una inexistente:
 * distinguirlas convertiría el endpoint en un detector de qué identificadores
 * existen en otras organizaciones.
 */
@Injectable()
export class PracticeOrganizationReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param practicesRepo - Lectura de la práctica y su tenant.
   * @param readRepo - Consultas por lote del árbol de la organización.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly readRepo: PracticeOrganizationReadRepository,
  ) {}

  /**
   * El árbol completo de una organización médica.
   *
   * @param practiceId - Práctica consultada.
   * @param tenantId - Tenant del contexto, que debe ser el dueño.
   * @returns Su ficha, sedes, áreas, espacios, servicios, plantilla,
   *   documentación legal e inventario.
   * @throws ResourceNotFoundException si la práctica no existe o es de otro tenant.
   */
  async getConsole(
    practiceId: string,
    tenantId: string,
  ): Promise<MedicalOrganizationConsoleDto> {
    const em = this.em.fork();
    const practice = await this.practicesRepo.findById(em, practiceId);
    if (!practice || practice.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    }

    const [sites, services, staff, documents, inventory] = await Promise.all([
      this.readRepo.findSites(em, practiceId),
      this.readRepo.findHealthcareServices(em, practiceId),
      this.readRepo.findRoleAssignments(em, practiceId),
      this.readRepo.findAccreditations(em, practiceId),
      this.readRepo.findInventoryItems(em, practiceId),
    ]);

    const siteIds = sites.map((site) => site.id);
    const [units, spaces, practitionerNames] = await Promise.all([
      this.readRepo.findClinicalUnits(em, siteIds),
      this.readRepo.findCareSpaces(em, siteIds),
      this.readRepo.findPractitionerNames(
        em,
        unique(staff.map((row) => row.practitionerProfileId)),
      ),
    ]);

    const concepts = await this.readRepo.findConcepts(
      em,
      conceptIds({
        practice: {
          typeConceptId: practice.typeConceptId,
          statusConceptId: practice.statusConceptId,
          currencyConceptId: practice.currencyConceptId,
        },
        sites,
        units,
        spaces,
        services,
        staff,
        documents,
        inventory,
      }),
    );
    const byId = new Map(concepts.map((concept) => [concept.id, concept]));

    const unitsBySite = countBy(units, (unit) => unit.practiceSiteId);
    const spacesBySite = countBy(spaces, (space) => space.practiceSiteId);
    const hoy = new Date();

    return {
      organization: this.header(practice, byId),
      sites: sites.map((site) =>
        this.site(
          site,
          byId,
          unitsBySite.get(site.id) ?? 0,
          spacesBySite.get(site.id) ?? 0,
        ),
      ),
      clinicalUnits: units.map((unit) => this.area(unit, byId)),
      careSpaces: spaces.map((space) => this.space(space, byId)),
      healthcareServices: services.map((service) =>
        this.service(service, byId),
      ),
      staff: staff.map((row) =>
        this.member(
          row,
          byId,
          practitionerNames.get(row.practitionerProfileId),
        ),
      ),
      legalDocuments: documents.map((doc) => this.document(doc, byId, hoy)),
      inventory: inventory.map((item) => this.supply(item, byId)),
    };
  }

  private header(
    practice: {
      readonly id: string;
      readonly code: string;
      readonly name: string;
      readonly typeConceptId: string;
      readonly statusConceptId: string;
      readonly timeZone?: string;
      readonly currencyConceptId?: string;
    },
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationHeaderDto {
    return {
      id: practice.id,
      code: practice.code,
      name: practice.name,
      type: concept(concepts, practice.typeConceptId),
      status: concept(concepts, practice.statusConceptId),
      timeZone: practice.timeZone ?? null,
      currency: optionalConcept(concepts, practice.currencyConceptId),
    };
  }

  private site(
    site: PracticeSites,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    clinicalUnitCount: number,
    careSpaceCount: number,
  ): OrganizationSiteDto {
    return {
      id: site.id,
      code: site.code,
      name: site.name,
      type: concept(concepts, site.siteTypeConceptId),
      physicalType: optionalConcept(concepts, site.physicalTypeConceptId),
      operationalStatus: optionalConcept(
        concepts,
        site.operationalStatusConceptId,
      ),
      status: concept(concepts, site.statusConceptId),
      timeZone: site.timeZone ?? null,
      branchId: site.branchId ?? null,
      clinicalUnitCount,
      careSpaceCount,
    };
  }

  private area(
    unit: ClinicalUnits,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationClinicalUnitDto {
    return {
      id: unit.id,
      siteId: unit.practiceSiteId,
      parentUnitId: unit.parentUnitId ?? null,
      code: unit.code,
      name: unit.name,
      type: concept(concepts, unit.unitTypeConceptId),
      specialty: optionalConcept(concepts, unit.specialtyConceptId),
      serviceMode: optionalConcept(concepts, unit.serviceModeConceptId),
      status: concept(concepts, unit.statusConceptId),
    };
  }

  private space(
    space: CareSpaces,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationCareSpaceDto {
    return {
      id: space.id,
      siteId: space.practiceSiteId,
      clinicalUnitId: space.clinicalUnitId ?? null,
      parentSpaceId: space.parentSpaceId ?? null,
      code: space.code,
      name: space.name,
      type: concept(concepts, space.spaceTypeConceptId),
      capacity: space.capacity ?? null,
      operationalStatus: optionalConcept(
        concepts,
        space.operationalStatusConceptId,
      ),
      status: concept(concepts, space.statusConceptId),
    };
  }

  private service(
    service: HealthcareServices,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationHealthcareServiceDto {
    return {
      id: service.id,
      siteId: service.practiceSiteId ?? null,
      clinicalUnitId: service.clinicalUnitId ?? null,
      service: concept(concepts, service.serviceConceptId),
      specialty: optionalConcept(concepts, service.specialtyConceptId),
      referralRequired: service.referralRequired ?? null,
      appointmentRequired: service.appointmentRequired ?? null,
      telehealthAvailable: service.telehealthAvailable ?? null,
      status: concept(concepts, service.statusConceptId),
    };
  }

  private member(
    row: PractitionerRoleAssignments,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    practitionerName: string | undefined,
  ): OrganizationStaffMemberDto {
    return {
      id: row.id,
      practitionerProfileId: row.practitionerProfileId,
      practitionerName: practitionerName ?? null,
      siteId: row.practiceSiteId ?? null,
      clinicalUnitId: row.clinicalUnitId ?? null,
      healthcareServiceId: row.healthcareServiceId ?? null,
      role: concept(concepts, row.roleConceptId),
      specialty: optionalConcept(concepts, row.specialtyConceptId),
      isPrimary: row.isPrimary ?? null,
      validFrom: soloDate(row.validFrom),
      validTo: soloDate(row.validTo),
      status: concept(concepts, row.statusConceptId),
    };
  }

  private document(
    doc: PracticeAccreditations,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    hoy: Date,
  ): OrganizationLegalDocumentDto {
    return {
      id: doc.id,
      siteId: doc.practiceSiteId ?? null,
      type: concept(concepts, doc.accreditationTypeConceptId),
      number: doc.accreditationNumber ?? null,
      issuerName: doc.issuerName ?? null,
      evidenceFileId: doc.evidenceFileId ?? null,
      validFrom: soloDate(doc.validFrom),
      validTo: soloDate(doc.validTo),
      daysToExpiry: daysUntil(doc.validTo, hoy),
      verificationStatus: concept(concepts, doc.verificationStatusConceptId),
    };
  }

  private supply(
    item: InventoryItems,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationInventoryItemDto {
    return {
      id: item.id,
      name: item.name,
      lotNumber: item.lotNumber ?? null,
      expiryDate: soloDate(item.expiryDate),
      quantityOnHand: item.quantityOnHand,
      unit: optionalConcept(concepts, item.unitConceptId),
      reorderLevel: item.reorderLevel ?? null,
      belowReorderLevel: restockPointLow(
        item.quantityOnHand,
        item.reorderLevel,
      ),
      status: concept(concepts, item.statusConceptId),
    };
  }
}

/**
 * El concepto traducido, o un marcador explícito si el catálogo no lo tiene.
 *
 * Devolver `Sin registrar` y no el uuid crudo es deliberado: un uuid en una
 * columna «Estado» no le dice nada a nadie, y esconder la fila entera perdería
 * un registro que sí existe. Mismo criterio que el directorio del módulo 23.
 */
function concept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): PracticeConceptDto {
  const valor = id === undefined ? undefined : concepts.get(id);
  return valor
    ? { code: valor.code, display: valor.display }
    : { code: 'UNKNOWN', display: 'Sin registrar' };
}

function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): PracticeConceptDto | null {
  return id === undefined ? null : concept(concepts, id);
}

function soloDate(valor: Date | undefined): string | null {
  return valor?.toISOString().slice(0, 10) ?? null;
}

/**
 * Días entre hoy y el vencimiento, redondeados hacia abajo.
 *
 * Se comparan **a medianoche UTC** para que un documento que vence hoy dé `0` y
 * no `-1` por unas horas de diferencia: la alerta la lee una persona que piensa
 * en días de calendario, no en instantes.
 */
function daysUntil(valor: Date | undefined, hoy: Date): number | null {
  if (valor === undefined) return null;
  const expires = Date.UTC(
    valor.getUTCFullYear(),
    valor.getUTCMonth(),
    valor.getUTCDate(),
  );
  const reference = Date.UTC(
    hoy.getUTCFullYear(),
    hoy.getUTCMonth(),
    hoy.getUTCDate(),
  );
  return Math.round((expires - reference) / ONE_DAY_MS);
}

/**
 * Si las existencias llegaron al punto de reposición.
 *
 * Las dos columnas son `numeric` y viajan como cadena para no perder
 * precisión; se comparan como número porque el umbral es una comparación de
 * magnitud, no de texto. Sin umbral configurado no hay faltante que declarar.
 */
function restockPointLow(
  quantityOnHand: string,
  reorderLevel: string | undefined,
): boolean {
  if (reorderLevel === undefined) return false;
  const stock = Number(quantityOnHand);
  const umbral = Number(reorderLevel);
  if (Number.isNaN(stock) || Number.isNaN(umbral)) return false;
  return stock <= umbral;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function countBy<T>(
  rows: readonly T[],
  keyOf: (fila: T) => string | undefined,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const row of rows) {
    const clave = keyOf(row);
    if (clave !== undefined) {
      result.set(clave, (result.get(clave) ?? 0) + 1);
    }
  }
  return result;
}

/** Todos los `*_concept_id` del árbol, sin repetir, para una única lectura. */
function conceptIds(sources: {
  readonly practice: {
    readonly typeConceptId: string;
    readonly statusConceptId: string;
    readonly currencyConceptId?: string;
  };
  readonly sites: readonly PracticeSites[];
  readonly units: readonly ClinicalUnits[];
  readonly spaces: readonly CareSpaces[];
  readonly services: readonly HealthcareServices[];
  readonly staff: readonly PractitionerRoleAssignments[];
  readonly documents: readonly PracticeAccreditations[];
  readonly inventory: readonly InventoryItems[];
}): string[] {
  return unique(
    [
      sources.practice.typeConceptId,
      sources.practice.statusConceptId,
      sources.practice.currencyConceptId,
      ...sources.sites.flatMap((site) => [
        site.siteTypeConceptId,
        site.physicalTypeConceptId,
        site.operationalStatusConceptId,
        site.statusConceptId,
      ]),
      ...sources.units.flatMap((unit) => [
        unit.unitTypeConceptId,
        unit.specialtyConceptId,
        unit.serviceModeConceptId,
        unit.statusConceptId,
      ]),
      ...sources.spaces.flatMap((space) => [
        space.spaceTypeConceptId,
        space.operationalStatusConceptId,
        space.statusConceptId,
      ]),
      ...sources.services.flatMap((service) => [
        service.serviceConceptId,
        service.specialtyConceptId,
        service.statusConceptId,
      ]),
      ...sources.staff.flatMap((row) => [
        row.roleConceptId,
        row.specialtyConceptId,
        row.statusConceptId,
      ]),
      ...sources.documents.flatMap((doc) => [
        doc.accreditationTypeConceptId,
        doc.verificationStatusConceptId,
      ]),
      ...sources.inventory.flatMap((item) => [
        item.unitConceptId,
        item.statusConceptId,
      ]),
    ].filter((id): id is string => id !== undefined),
  );
}
