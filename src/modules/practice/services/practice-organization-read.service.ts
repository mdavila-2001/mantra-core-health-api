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
const UN_DIA_MS = 24 * 60 * 60 * 1000;

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
        unicos(staff.map((row) => row.practitionerProfileId)),
      ),
    ]);

    const conceptos = await this.readRepo.findConcepts(
      em,
      conceptIdsDe({
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
    const porId = new Map(conceptos.map((concepto) => [concepto.id, concepto]));

    const unidadesPorSede = contarPor(units, (unit) => unit.practiceSiteId);
    const espaciosPorSede = contarPor(spaces, (space) => space.practiceSiteId);
    const hoy = new Date();

    return {
      organization: this.cabecera(practice, porId),
      sites: sites.map((site) =>
        this.sede(
          site,
          porId,
          unidadesPorSede.get(site.id) ?? 0,
          espaciosPorSede.get(site.id) ?? 0,
        ),
      ),
      clinicalUnits: units.map((unit) => this.area(unit, porId)),
      careSpaces: spaces.map((space) => this.espacio(space, porId)),
      healthcareServices: services.map((service) =>
        this.servicio(service, porId),
      ),
      staff: staff.map((row) =>
        this.integrante(
          row,
          porId,
          practitionerNames.get(row.practitionerProfileId),
        ),
      ),
      legalDocuments: documents.map((doc) => this.documento(doc, porId, hoy)),
      inventory: inventory.map((item) => this.insumo(item, porId)),
    };
  }

  private cabecera(
    practice: {
      readonly id: string;
      readonly code: string;
      readonly name: string;
      readonly typeConceptId: string;
      readonly statusConceptId: string;
      readonly timeZone?: string;
      readonly currencyConceptId?: string;
    },
    conceptos: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationHeaderDto {
    return {
      id: practice.id,
      code: practice.code,
      name: practice.name,
      type: concepto(conceptos, practice.typeConceptId),
      status: concepto(conceptos, practice.statusConceptId),
      timeZone: practice.timeZone ?? null,
      currency: conceptoOpcional(conceptos, practice.currencyConceptId),
    };
  }

  private sede(
    site: PracticeSites,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    clinicalUnitCount: number,
    careSpaceCount: number,
  ): OrganizationSiteDto {
    return {
      id: site.id,
      code: site.code,
      name: site.name,
      type: concepto(conceptos, site.siteTypeConceptId),
      physicalType: conceptoOpcional(conceptos, site.physicalTypeConceptId),
      operationalStatus: conceptoOpcional(
        conceptos,
        site.operationalStatusConceptId,
      ),
      status: concepto(conceptos, site.statusConceptId),
      timeZone: site.timeZone ?? null,
      branchId: site.branchId ?? null,
      clinicalUnitCount,
      careSpaceCount,
    };
  }

  private area(
    unit: ClinicalUnits,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationClinicalUnitDto {
    return {
      id: unit.id,
      siteId: unit.practiceSiteId,
      parentUnitId: unit.parentUnitId ?? null,
      code: unit.code,
      name: unit.name,
      type: concepto(conceptos, unit.unitTypeConceptId),
      specialty: conceptoOpcional(conceptos, unit.specialtyConceptId),
      serviceMode: conceptoOpcional(conceptos, unit.serviceModeConceptId),
      status: concepto(conceptos, unit.statusConceptId),
    };
  }

  private espacio(
    space: CareSpaces,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationCareSpaceDto {
    return {
      id: space.id,
      siteId: space.practiceSiteId,
      clinicalUnitId: space.clinicalUnitId ?? null,
      parentSpaceId: space.parentSpaceId ?? null,
      code: space.code,
      name: space.name,
      type: concepto(conceptos, space.spaceTypeConceptId),
      capacity: space.capacity ?? null,
      operationalStatus: conceptoOpcional(
        conceptos,
        space.operationalStatusConceptId,
      ),
      status: concepto(conceptos, space.statusConceptId),
    };
  }

  private servicio(
    service: HealthcareServices,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationHealthcareServiceDto {
    return {
      id: service.id,
      siteId: service.practiceSiteId ?? null,
      clinicalUnitId: service.clinicalUnitId ?? null,
      service: concepto(conceptos, service.serviceConceptId),
      specialty: conceptoOpcional(conceptos, service.specialtyConceptId),
      referralRequired: service.referralRequired ?? null,
      appointmentRequired: service.appointmentRequired ?? null,
      telehealthAvailable: service.telehealthAvailable ?? null,
      status: concepto(conceptos, service.statusConceptId),
    };
  }

  private integrante(
    row: PractitionerRoleAssignments,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    practitionerName: string | undefined,
  ): OrganizationStaffMemberDto {
    return {
      id: row.id,
      practitionerProfileId: row.practitionerProfileId,
      practitionerName: practitionerName ?? null,
      siteId: row.practiceSiteId ?? null,
      clinicalUnitId: row.clinicalUnitId ?? null,
      healthcareServiceId: row.healthcareServiceId ?? null,
      role: concepto(conceptos, row.roleConceptId),
      specialty: conceptoOpcional(conceptos, row.specialtyConceptId),
      isPrimary: row.isPrimary ?? null,
      validFrom: soloFecha(row.validFrom),
      validTo: soloFecha(row.validTo),
      status: concepto(conceptos, row.statusConceptId),
    };
  }

  private documento(
    doc: PracticeAccreditations,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    hoy: Date,
  ): OrganizationLegalDocumentDto {
    return {
      id: doc.id,
      siteId: doc.practiceSiteId ?? null,
      type: concepto(conceptos, doc.accreditationTypeConceptId),
      number: doc.accreditationNumber ?? null,
      issuerName: doc.issuerName ?? null,
      evidenceFileId: doc.evidenceFileId ?? null,
      validFrom: soloFecha(doc.validFrom),
      validTo: soloFecha(doc.validTo),
      daysToExpiry: diasHasta(doc.validTo, hoy),
      verificationStatus: concepto(conceptos, doc.verificationStatusConceptId),
    };
  }

  private insumo(
    item: InventoryItems,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
  ): OrganizationInventoryItemDto {
    return {
      id: item.id,
      name: item.name,
      lotNumber: item.lotNumber ?? null,
      expiryDate: soloFecha(item.expiryDate),
      quantityOnHand: item.quantityOnHand,
      unit: conceptoOpcional(conceptos, item.unitConceptId),
      reorderLevel: item.reorderLevel ?? null,
      belowReorderLevel: bajoElPuntoDeReposicion(
        item.quantityOnHand,
        item.reorderLevel,
      ),
      status: concepto(conceptos, item.statusConceptId),
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
function concepto(
  conceptos: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): PracticeConceptDto {
  const valor = id === undefined ? undefined : conceptos.get(id);
  return valor
    ? { code: valor.code, display: valor.display }
    : { code: 'UNKNOWN', display: 'Sin registrar' };
}

function conceptoOpcional(
  conceptos: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): PracticeConceptDto | null {
  return id === undefined ? null : concepto(conceptos, id);
}

function soloFecha(valor: Date | undefined): string | null {
  return valor?.toISOString().slice(0, 10) ?? null;
}

/**
 * Días entre hoy y el vencimiento, redondeados hacia abajo.
 *
 * Se comparan **a medianoche UTC** para que un documento que vence hoy dé `0` y
 * no `-1` por unas horas de diferencia: la alerta la lee una persona que piensa
 * en días de calendario, no en instantes.
 */
function diasHasta(valor: Date | undefined, hoy: Date): number | null {
  if (valor === undefined) return null;
  const vence = Date.UTC(
    valor.getUTCFullYear(),
    valor.getUTCMonth(),
    valor.getUTCDate(),
  );
  const referencia = Date.UTC(
    hoy.getUTCFullYear(),
    hoy.getUTCMonth(),
    hoy.getUTCDate(),
  );
  return Math.round((vence - referencia) / UN_DIA_MS);
}

/**
 * Si las existencias llegaron al punto de reposición.
 *
 * Las dos columnas son `numeric` y viajan como cadena para no perder
 * precisión; se comparan como número porque el umbral es una comparación de
 * magnitud, no de texto. Sin umbral configurado no hay faltante que declarar.
 */
function bajoElPuntoDeReposicion(
  quantityOnHand: string,
  reorderLevel: string | undefined,
): boolean {
  if (reorderLevel === undefined) return false;
  const existencias = Number(quantityOnHand);
  const umbral = Number(reorderLevel);
  if (Number.isNaN(existencias) || Number.isNaN(umbral)) return false;
  return existencias <= umbral;
}

function unicos(valores: readonly string[]): string[] {
  return [...new Set(valores)];
}

function contarPor<T>(
  filas: readonly T[],
  claveDe: (fila: T) => string | undefined,
): Map<string, number> {
  const resultado = new Map<string, number>();
  for (const fila of filas) {
    const clave = claveDe(fila);
    if (clave !== undefined) {
      resultado.set(clave, (resultado.get(clave) ?? 0) + 1);
    }
  }
  return resultado;
}

/** Todos los `*_concept_id` del árbol, sin repetir, para una única lectura. */
function conceptIdsDe(fuentes: {
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
  return unicos(
    [
      fuentes.practice.typeConceptId,
      fuentes.practice.statusConceptId,
      fuentes.practice.currencyConceptId,
      ...fuentes.sites.flatMap((site) => [
        site.siteTypeConceptId,
        site.physicalTypeConceptId,
        site.operationalStatusConceptId,
        site.statusConceptId,
      ]),
      ...fuentes.units.flatMap((unit) => [
        unit.unitTypeConceptId,
        unit.specialtyConceptId,
        unit.serviceModeConceptId,
        unit.statusConceptId,
      ]),
      ...fuentes.spaces.flatMap((space) => [
        space.spaceTypeConceptId,
        space.operationalStatusConceptId,
        space.statusConceptId,
      ]),
      ...fuentes.services.flatMap((service) => [
        service.serviceConceptId,
        service.specialtyConceptId,
        service.statusConceptId,
      ]),
      ...fuentes.staff.flatMap((row) => [
        row.roleConceptId,
        row.specialtyConceptId,
        row.statusConceptId,
      ]),
      ...fuentes.documents.flatMap((doc) => [
        doc.accreditationTypeConceptId,
        doc.verificationStatusConceptId,
      ]),
      ...fuentes.inventory.flatMap((item) => [
        item.unitConceptId,
        item.statusConceptId,
      ]),
    ].filter((id): id is string => id !== undefined),
  );
}
