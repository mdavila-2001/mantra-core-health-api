import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
// Las direcciones son datos transversales (`common.addresses`); se leían y no
// se escribían acá, por eso originalmente sólo se importaba la entidad. ALV-006
// agrega la escritura de la sede propia, y para eso sí hace falta el
// repositorio — igual que `ServiceCatalogRepository` (de `billing`) más abajo,
// se registra la clase sin importar `CommonModule` entero.
import { Addresses } from '../../common/entities';
import { AddressesRepository } from '../../common/repositories';
// Mismo patrón que `clinical_ext` con `ProfileOwnershipService`: se importa la
// clase puntual, no `ProfilesModule`, para no cerrar un ciclo entre módulos.
import { ProfileOwnershipService } from '../../profiles/services/profile-ownership.service';
import { PRAC } from '../practice.concepts';
import {
  CareSpacesRepository,
  PracticeSitesRepository,
  PracticesRepository,
  PractitionerRoleAssignmentsRepository,
} from '../repositories';
import { CreateOwnSiteDto, PractitionerSiteDto } from '../dto';
import type { PracticeSites } from '../entities';

/**
 * Referencia de un recurso agendable a la entidad que lo respalda.
 *
 * Es lo que `scheduling.schedulable_resources` guarda como
 * `resource_ref_type`/`resource_ref_id`, y lo único que hace falta para saber
 * dónde se atiende con ese recurso.
 */
export interface ResourceSiteRef {
  /** Tabla a la que apunta el recurso. */
  readonly refType: string;
  /** Fila apuntada. */
  readonly refId: string;
}

/** Los `resource_ref_type` que apuntan a un profesional. */
const REF_PRACTITIONER = new Set([
  'health_practitioner_profiles',
  'practitioner_profiles',
  'practitioners',
]);

/** Los `resource_ref_type` que apuntan a un espacio físico. */
const REF_CARE_SPACE = new Set(['care_spaces', 'rooms']);

/**
 * **Dónde atiende cada profesional** — la mitad que le faltaba a la agenda.
 *
 * ## El dato existía y nadie lo publicaba
 *
 * `practice.practitioner_role_assignments` guarda `practice_site_id` desde
 * siempre: es la fila que dice en qué sede ejerce cada profesional. Pero
 * ninguna lectura la devolvía junto al profesional, así que el sistema sabía
 * *cuándo* atiende alguien —`GET /scheduling/slots`— y no *dónde*. Un turno sin
 * dirección obliga a averiguarla por fuera del sistema, que es exactamente lo
 * que el sistema existe para evitar.
 *
 * ## Por qué esto no necesitó una columna nueva
 *
 * La tentación era colgarle un `site_id` a `schedulable_resources`. No hace
 * falta y sería peor: el recurso ya declara a qué apunta
 * (`resource_ref_type`/`resource_ref_id`), y desde ahí la sede se deriva —por
 * la asignación de rol si es un profesional, por el espacio de atención si es
 * un box o un quirófano—. Una columna nueva sería un segundo lugar donde
 * guardar el mismo hecho, y el día que discreparan no habría forma de saber
 * cuál miente.
 *
 * ## La resolución es por lote
 *
 * La agenda pinta todos sus recursos de una vez. Resolver de a uno serían
 * tantas consultas como recursos tenga la organización, y es la clase de N+1
 * que no se nota en desarrollo y sí en una sala de espera.
 */
@Injectable()
export class PractitionerSitesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practicesRepo - Prácticas, para acotar por tenant.
   * @param sitesRepo - Sedes.
   * @param spacesRepo - Espacios de atención.
   * @param rolesRepo - Asignaciones de rol, de donde sale la sede del profesional.
   * @param addressesRepo - Direcciones (ALV-006: alta de la sede propia).
   * @param ownership - Resuelve el perfil profesional del actor autenticado.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly ownership: ProfileOwnershipService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerSitesService.name);
  }

  /**
   * ALV-005/006: da de alta un consultorio propio del profesional autenticado.
   *
   * El alta de profesional dejaba un hueco concreto: "atiendo en mi propio
   * consultorio" no tenía dónde registrarse sin pasar por una afiliación a una
   * organización que no existe. Esto resuelve las tres filas en una
   * transacción — práctica personal (reutilizada si ya existe), dirección (si
   * se manda) y sede — más la asignación de rol que la conecta con la agenda.
   *
   * La práctica personal es idempotente por profesional: la segunda sede que
   * agregue cuelga de la MISMA práctica, no de una nueva.
   *
   * @param actor - El profesional autenticado.
   * @param dto - Nombre, huso horario y dirección opcional de la sede.
   * @returns La sede recién creada, en el mismo formato que {@link listSitesOfPractitioner}.
   */
  async createOwnSite(
    actor: AuthenticatedUser,
    dto: CreateOwnSiteDto,
  ): Promise<PractitionerSiteDto> {
    this.logger.info(
      { operation: 'practice.sites.createOwn', actorId: actor.id },
      'Creating practitioner own site',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const practitionerProfileId =
        await this.ownership.requireOwnPractitionerProfileId(tx, actor);

      let practice = await this.practicesRepo.findOwnOffice(
        tx,
        tenantId,
        actor.id,
        PRAC.PRACTICE_TYPE_OFFICE,
      );
      if (!practice) {
        practice = this.practicesRepo.create(tx, {
          tenantId,
          // Determinista y único por usuario: dos altas del mismo profesional
          // deben resolver a la MISMA práctica, no chocar por código.
          code: `OFFICE-${actor.id}`,
          name: 'Consultorio propio',
          typeConceptId: PRAC.PRACTICE_TYPE_OFFICE,
          adminUserId: actor.id,
          statusConceptId: PRAC.PRACTICE_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      let addressId: string | undefined;
      if (dto.address) {
        const address = this.addressesRepo.create(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_USER,
          ownerId: actor.id,
          lines: dto.address.lines.join('\n'),
          city: dto.address.city,
          municipalityConceptId: dto.address.municipalityConceptId,
          administrativeAreaConceptId: dto.address.administrativeAreaConceptId,
          countryConceptId: CONCEPTS.COUNTRY_BO,
          useConceptId: CONCEPTS.ADDR_USE_HOME,
          typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
          latitude:
            dto.address.latitude !== undefined
              ? String(dto.address.latitude)
              : undefined,
          longitude:
            dto.address.longitude !== undefined
              ? String(dto.address.longitude)
              : undefined,
          actorUserId: actor.id,
        });
        await tx.flush();
        addressId = address.id;
      }

      const code = await this.uniqueSiteCode(tx, practice.id, dto.name);
      const site = this.sitesRepo.create(tx, {
        practiceId: practice.id,
        code,
        name: dto.name,
        siteTypeConceptId: PRAC.SITE_TYPE_OFFICE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        timeZone: dto.timeZone,
        addressId,
        managingTenantId: tenantId,
        statusConceptId: PRAC.SITE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.rolesRepo.create(tx, {
        practitionerProfileId,
        practiceId: practice.id,
        practiceSiteId: site.id,
        roleConceptId: PRAC.ROLE_ATTENDING,
        // Es su propio consultorio: no hay nadie más a quien pedirle permiso,
        // así que nace activa directo (mismo criterio que el bootstrap de
        // práctica, no el de pedir unirse a la de otro — eso sí nace
        // pendiente, ver `selfRequestAffiliation`).
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        isPrimary: false,
        validFrom: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'practice.sites.createOwn', siteId: site.id },
        'Practitioner own site created',
      );
      return {
        id: site.id,
        practiceId: site.practiceId,
        code: site.code,
        name: site.name,
        timeZone: site.timeZone ?? null,
        addressText: dto.address ? ownSiteAddressText(dto.address) : null,
        latitude: dto.address?.latitude ?? null,
        longitude: dto.address?.longitude ?? null,
        status: site.statusConceptId,
      };
    });
  }

  /**
   * ALV-005: retira una sede propia. No la borra —queda como historial de la
   * práctica—, cierra la asignación de rol que la conectaba con la agenda.
   *
   * @param actor - El profesional autenticado.
   * @param siteId - La sede a retirar.
   * @throws ResourceNotFoundException si la sede no es una asignación vigente del actor.
   */
  async deleteOwnSite(actor: AuthenticatedUser, siteId: string): Promise<void> {
    return this.em.transactional(async (tx) => {
      const practitionerProfileId =
        await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const assignment = await this.rolesRepo.findCurrentBySite(
        tx,
        practitionerProfileId,
        siteId,
      );
      if (!assignment) {
        throw new ResourceNotFoundException(
          'No tenés una vinculación vigente con esa sede',
          { siteId },
        );
      }
      assignment.statusConceptId = PRAC.ROLE_ASSIGNMENT_ENDED;
      assignment.validTo = new Date();
      assignment.updatedByUserId = actor.id;
      assignment.updatedAt = new Date();
      await tx.flush();
      this.logger.info(
        { operation: 'practice.sites.deleteOwn', siteId },
        'Practitioner own site assignment ended',
      );
    });
  }

  /**
   * Un código de sitio único dentro de la práctica, derivado del nombre.
   *
   * `createSite` (el alta administrativa) exige el código como dato del
   * cliente; acá no tiene sentido pedírselo al profesional —es un detalle de
   * unicidad interna, no algo que el consultorio "tenga"—, así que se deriva
   * y se resuelve el choque con un sufijo numérico.
   */
  private async uniqueSiteCode(
    em: EntityManager,
    practiceId: string,
    name: string,
  ): Promise<string> {
    const base = name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);
    let candidate = base || 'CONSULTORIO';
    let suffix = 1;
    while (
      await this.sitesRepo.findByPracticeAndCode(em, practiceId, candidate)
    ) {
      suffix += 1;
      candidate = `${base || 'CONSULTORIO'}-${suffix}`;
    }
    return candidate;
  }

  /**
   * Las sedes donde un profesional atiende hoy (UC-14-15).
   *
   * Vacío significa «no tiene asignación vigente con sede», que es distinto de
   * «no existe»: quien la consuma no debe leerlo como un error.
   *
   * @param practitionerProfileId - Profesional consultado.
   * @param tenantId - Organización del contexto.
   * @returns Sus sedes, la principal primero.
   */
  async listSitesOfPractitioner(
    practitionerProfileId: string,
    tenantId: string,
  ): Promise<PractitionerSiteDto[]> {
    const em = this.em.fork();
    const assignments = await this.rolesRepo.findCurrentWithSite(
      em,
      [practitionerProfileId],
      PRAC.ROLE_ASSIGNMENT_ACTIVE,
    );
    const siteIds = unique(
      assignments
        .map((a) => a.practiceSiteId)
        .filter((id): id is string => id !== undefined),
    );
    const sites = await this.loadSites(em, siteIds, tenantId);

    const resueltas: PractitionerSiteDto[] = [];
    for (const siteId of siteIds) {
      const site = sites.get(siteId);
      if (site) resueltas.push(site);
    }
    return resueltas;
  }

  /**
   * La sede de cada recurso agendable, resuelta de una sola pasada.
   *
   * @param refs - Las referencias que declaran los recursos.
   * @param tenantId - Organización del contexto.
   * @returns Un mapa `refId → sede`, sin entrada para lo que no se pudo resolver.
   */
  async resolveSitesForResources(
    refs: readonly ResourceSiteRef[],
    tenantId: string,
  ): Promise<Map<string, PractitionerSiteDto>> {
    const resuelto = new Map<string, PractitionerSiteDto>();
    if (refs.length === 0) return resuelto;

    const em = this.em.fork();
    const practitionerIds = unique(
      refs.filter((r) => REF_PRACTITIONER.has(r.refType)).map((r) => r.refId),
    );
    const spaceIds = unique(
      refs.filter((r) => REF_CARE_SPACE.has(r.refType)).map((r) => r.refId),
    );

    /** `refId` del recurso → sede que le corresponde. */
    const sitePorRef = new Map<string, string>();

    const assignments = await this.rolesRepo.findCurrentWithSite(
      em,
      practitionerIds,
      PRAC.ROLE_ASSIGNMENT_ACTIVE,
    );
    for (const assignment of assignments) {
      // La primera gana, y el repositorio ya puso la principal delante: un
      // profesional con dos consultorios tiene uno que es «el suyo».
      if (
        assignment.practiceSiteId &&
        !sitePorRef.has(assignment.practitionerProfileId)
      ) {
        sitePorRef.set(
          assignment.practitionerProfileId,
          assignment.practiceSiteId,
        );
      }
    }

    for (const spaceId of spaceIds) {
      const space = await this.spacesRepo.findById(em, spaceId);
      if (space) sitePorRef.set(spaceId, space.practiceSiteId);
    }

    const sites = await this.loadSites(
      em,
      unique([...sitePorRef.values()]),
      tenantId,
    );
    for (const [refId, siteId] of sitePorRef) {
      const site = sites.get(siteId);
      if (site) resuelto.set(refId, site);
    }
    return resuelto;
  }

  /**
   * Carga las sedes del tenant y las proyecta con su dirección.
   *
   * Las sedes de otra organización se descartan en silencio: la alternativa
   * —fallar— convertiría un recurso mal configurado en una agenda que no carga.
   */
  private async loadSites(
    em: EntityManager,
    siteIds: readonly string[],
    tenantId: string,
  ): Promise<Map<string, PractitionerSiteDto>> {
    const resultado = new Map<string, PractitionerSiteDto>();
    if (siteIds.length === 0) return resultado;

    const propias: PracticeSites[] = [];
    for (const siteId of siteIds) {
      const site = await this.sitesRepo.findById(em, siteId);
      if (!site) continue;
      const practice = await this.practicesRepo.findById(em, site.practiceId);
      if (!practice || practice.tenantId !== tenantId) {
        this.logger.warn(
          { operation: 'practice.sites.resolve', siteId },
          'Sede de otra organización referida por un recurso: se omite',
        );
        continue;
      }
      propias.push(site);
    }

    for (const site of propias) {
      const address = site.addressId
        ? await em.findOne(Addresses, { id: site.addressId })
        : null;
      resultado.set(site.id, {
        id: site.id,
        practiceId: site.practiceId,
        code: site.code,
        name: site.name,
        timeZone: site.timeZone ?? null,
        addressText: address ? addressText(address) : null,
        latitude:
          address?.latitude !== undefined ? Number(address.latitude) : null,
        longitude:
          address?.longitude !== undefined ? Number(address.longitude) : null,
        status: site.statusConceptId,
      });
    }
    return resultado;
  }

  /**
   * Comprueba que la sede exista y sea del tenant.
   *
   * @param siteId - Sede consultada.
   * @param tenantId - Organización del contexto.
   * @returns La sede proyectada.
   * @throws ResourceNotFoundException si no existe o es de otra organización.
   */
  async getSite(
    siteId: string,
    tenantId: string,
  ): Promise<PractitionerSiteDto> {
    const sites = await this.loadSites(this.em.fork(), [siteId], tenantId);
    const site = sites.get(siteId);
    if (!site) {
      throw new ResourceNotFoundException('Sede no encontrada', { siteId });
    }
    return site;
  }
}

/** Los mismos identificadores, sin repetidos y conservando el orden. */
function unique(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

/**
 * La dirección en una línea, o `null` si no tiene nada que decir.
 *
 * Se compone acá y no en la vista porque el orden de los campos es del dato, no
 * de la pantalla, y porque una dirección vacía tiene que llegar como ausencia y
 * no como una cadena de comas.
 */
function addressText(address: Addresses): string | null {
  const partes = [address.lines, address.city, address.postalCode]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte));
  return partes.length === 0 ? null : partes.join(', ');
}

/**
 * Igual que {@link addressText}, para el `OwnSiteAddressDto` que
 * `createOwnSite` acaba de recibir y todavía no releyó de la base.
 *
 * Compone `lines` igual que `AddressesService.create` la va a persistir —
 * unidas por salto de línea, como una sola "parte"— para que la respuesta
 * inmediata coincida con lo que un `GET` posterior mostraría.
 */
function ownSiteAddressText(address: {
  lines: string[];
  city?: string;
}): string | null {
  const partes = [address.lines.join('\n'), address.city]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => Boolean(parte));
  return partes.length === 0 ? null : partes.join(', ');
}
