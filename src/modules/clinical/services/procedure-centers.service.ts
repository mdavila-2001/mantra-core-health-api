import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  coordinateOf,
  straightLineKm,
  type AuthenticatedUser,
  type GeoPoint,
} from '../../../common';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import type { Addresses } from '../../common/entities';
import type {
  HealthcareServices,
  PracticeSites,
} from '../../practice/entities';
import { ProcedureCentersReadRepository } from '../repositories';
import {
  PROCEDURE_CENTERS_MAX_LIMIT,
  type PendingProcedureDto,
  type ProcedureCenterDto,
  type ProcedureCentersQueryDto,
  type ProcedureCentersResponseDto,
} from '../dto';

const DEFAULT_LIMIT = 20;

const WITHOUT_PATIENT_PROFILE =
  'La sesión no tiene un perfil de paciente con órdenes que consultar.';

/**
 * «¿Dónde me hago lo que me pidieron?» para procedimientos (carril 19).
 *
 * Es la tercera pestaña de la pantalla de la receta, gemela de la de
 * imagenología (`DiagnosticUnitsSearchService.searchCoverage`): mismas reglas de
 * cobertura y de orden, distinta fuente. Las órdenes son las del titular en las
 * categorías de `MEDICAL_CENTER_CATEGORIES`, y la oferta es lo que cada
 * establecimiento declara en `practice.healthcare_services`.
 *
 * ## Qué cuenta como «ofrece»
 *
 * Un servicio activo con el mismo concepto que la orden. Si el servicio nombra
 * una sede, vale para esa sede; si no nombra ninguna, el establecimiento lo
 * declara para todas sus sedes abiertas. No se infiere nada más: una sede que
 * no declaró el procedimiento no aparece como si lo tuviera.
 */
@Injectable()
export class ProcedureCentersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readRepo - Órdenes, oferta, sedes y direcciones.
   * @param accountLinksRepo - Cuenta → persona.
   * @param patientProfilesRepo - Persona → perfil de paciente.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: ProcedureCentersReadRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProcedureCentersService.name);
  }

  /**
   * Los procedimientos pendientes del titular y las sedes que los ofrecen.
   *
   * @param actor - Usuario autenticado; el paciente sale de su cuenta.
   * @param query - Origen opcional y tope.
   * @returns Procedimientos pendientes y sedes, completas primero.
   * @throws ForbiddenException si la sesión no tiene perfil de paciente.
   * @throws BadRequestException si llega `lat` sin `lng` o al revés.
   */
  async findForOwnOrders(
    actor: AuthenticatedUser,
    query: ProcedureCentersQueryDto,
  ): Promise<ProcedureCentersResponseDto> {
    const origin = originOf(query.lat, query.lng);
    const limit = Math.min(
      query.limit ?? DEFAULT_LIMIT,
      PROCEDURE_CENTERS_MAX_LIMIT,
    );
    const em = this.em.fork();
    const patientProfileId = await this.resolveOwnPatientProfileId(em, actor);

    const orders = await this.readRepo.findPendingOrders(em, patientProfileId);
    const procedures = uniqueByConcept(
      orders.map((order): PendingProcedureDto => ({
        serviceRequestId: order.id,
        conceptId: order.codeConceptId,
        categoryConceptId: order.categoryConceptId as string,
        requestedAt: order.createdAt,
      })),
    );

    this.logger.info(
      {
        operation: 'clinical.procedure-centers.read',
        patientProfileId,
        procedimientos: procedures.length,
        conOrigen: origin !== undefined,
      },
      'Buscando centros para los procedimientos pendientes del titular',
    );

    const none = { procedures, centers: [], total: 0, limit };
    if (procedures.length === 0) return none;

    const requested = procedures.map((procedure) => procedure.conceptId);
    const offerings = await this.readRepo.findActiveOfferings(em, requested);
    if (offerings.length === 0) return none;

    const practices = await this.readRepo.findActivePractices(em, [
      ...new Set(offerings.map((offering) => offering.practiceId)),
    ]);
    if (practices.length === 0) return none;
    const practiceById = new Map(practices.map((p) => [p.id, p]));

    const sites = await this.readRepo.findOpenSites(em, [
      ...practiceById.keys(),
    ]);
    const offeredBySite = offeredConceptsBySite(offerings, sites);
    if (offeredBySite.size === 0) return none;

    const addresses = await this.readRepo.findAddresses(em, [
      ...new Set(
        sites
          .filter((site) => offeredBySite.has(site.id))
          .flatMap((site) => (site.addressId ? [site.addressId] : [])),
      ),
    ]);
    const addressById = new Map(addresses.map((a) => [a.id, a]));

    const centers = sites
      .filter((site) => offeredBySite.has(site.id))
      .map((site): ProcedureCenterDto => {
        const offered = offeredBySite.get(site.id) as Set<string>;
        const missing = requested.filter((id) => !offered.has(id));
        const place = placeOf(
          site.addressId ? addressById.get(site.addressId) : undefined,
        );
        return {
          siteId: site.id,
          practiceId: site.practiceId,
          practiceName: practiceById.get(site.practiceId)?.name ?? site.name,
          siteName: site.name,
          complete: missing.length === 0,
          missingProcedureConceptIds: missing,
          distanceKm:
            origin === undefined ||
            place.latitude === null ||
            place.longitude === null
              ? null
              : straightLineKm(origin, {
                  lat: place.latitude,
                  lng: place.longitude,
                }),
          ...place,
        };
      })
      .sort(byCoverage);

    return {
      procedures,
      centers: centers.slice(0, limit),
      total: centers.length,
      limit,
    };
  }

  /** Cuenta → persona → perfil de paciente; nunca un id por parámetro. */
  private async resolveOwnPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const profile = link
      ? await this.patientProfilesRepo.findById(em, link.personId)
      : null;
    if (!link || !profile) {
      this.logger.warn(
        { operation: 'clinical.procedure-centers.denied', userId: actor.id },
        'Sesión sin perfil de paciente pidió centros para sus procedimientos',
      );
      throw new ForbiddenException(WITHOUT_PATIENT_PROFILE);
    }
    return profile.profileId;
  }
}

/** Un procedimiento pedido dos veces se busca una sola vez: el más reciente. */
function uniqueByConcept(
  procedures: readonly PendingProcedureDto[],
): PendingProcedureDto[] {
  const seen = new Set<string>();
  return procedures.filter((procedure) => {
    if (seen.has(procedure.conceptId)) return false;
    seen.add(procedure.conceptId);
    return true;
  });
}

/**
 * Qué conceptos ofrece cada sede abierta.
 *
 * Un servicio con sede vale sólo para esa sede (si está abierta); uno sin sede
 * vale para todas las sedes abiertas de su establecimiento.
 */
function offeredConceptsBySite(
  offerings: readonly HealthcareServices[],
  sites: readonly PracticeSites[],
): Map<string, Set<string>> {
  const openSiteIds = new Set(sites.map((site) => site.id));
  const sitesByPractice = new Map<string, string[]>();
  for (const site of sites) {
    const list = sitesByPractice.get(site.practiceId) ?? [];
    list.push(site.id);
    sitesByPractice.set(site.practiceId, list);
  }

  const offered = new Map<string, Set<string>>();
  for (const offering of offerings) {
    const targets = offering.practiceSiteId
      ? openSiteIds.has(offering.practiceSiteId)
        ? [offering.practiceSiteId]
        : []
      : (sitesByPractice.get(offering.practiceId) ?? []);
    for (const siteId of targets) {
      const set = offered.get(siteId) ?? new Set<string>();
      set.add(offering.serviceConceptId);
      offered.set(siteId, set);
    }
  }
  return offered;
}

/** Dirección en una línea y coordenadas, o `null` en lo que falte. */
function placeOf(address: Addresses | undefined): {
  addressText: string | null;
  latitude: number | null;
  longitude: number | null;
} {
  if (address === undefined) {
    return { addressText: null, latitude: null, longitude: null };
  }
  const parts = [address.lines, address.city, address.postalCode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return {
    addressText: parts.length === 0 ? null : parts.join(', '),
    latitude: coordinateOf(address.latitude),
    longitude: coordinateOf(address.longitude),
  };
}

/** El origen pedido: `lat` y `lng` van juntos o no van. */
function originOf(
  lat: number | undefined,
  lng: number | undefined,
): GeoPoint | undefined {
  if (lat === undefined && lng === undefined) return undefined;
  if (lat === undefined || lng === undefined) {
    throw new BadRequestException(
      'lat y lng van juntos: mande ambos para ordenar por distancia, o ninguno',
    );
  }
  return { lat, lng };
}

/** Completas primero, después la más cercana (sin distancia al final), después por nombre. */
function byCoverage(a: ProcedureCenterDto, b: ProcedureCenterDto): number {
  if (a.complete !== b.complete) return a.complete ? -1 : 1;
  if (a.distanceKm !== b.distanceKm) {
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  }
  return `${a.practiceName} ${a.siteName}`.localeCompare(
    `${b.practiceName} ${b.siteName}`,
    'es',
  );
}
