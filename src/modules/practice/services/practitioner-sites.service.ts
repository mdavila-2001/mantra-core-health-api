import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  requireTenantId,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
// Las direcciones son datos transversales (`common.addresses`): el alta de la
// sede propia las escribe desde `OwnSiteProvisioningService`, y la corrección
// (P32-b) desde acá, que es donde vive el caso de uso de «mudé mi consultorio».
import { Addresses } from '../../common/entities';
import { AddressesRepository } from '../../common/repositories';
// Mismo patrón que `clinical_ext` con `ProfileOwnershipService`: se importa la
// clase puntual, no `ProfilesModule`, para no cerrar un ciclo entre módulos.
import { ProfileOwnershipService } from '../../profiles/services/profile-ownership.service';
import { PersonAccountLinksRepository } from '../../profiles/repositories';
import { PRAC } from '../practice.concepts';
import {
  CareSpacesRepository,
  PracticeSitesRepository,
  PracticesRepository,
  PractitionerRoleAssignmentsRepository,
} from '../repositories';
import {
  CreateOwnSiteDto,
  OwnSiteAddressDto,
  PractitionerSiteDto,
  UpdateOwnSiteDto,
} from '../dto';
import type { PracticeSites } from '../entities';
import { OwnSiteProvisioningService } from './own-site-provisioning.service';

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
   * @param addressesRepo - Direcciones, para la mudanza del consultorio propio (P32-b).
   * @param accountLinksRepo - Vínculo persona↔cuenta, para saber de quién es la práctica personal.
   * @param provisioning - Alta transaccional del consultorio propio (ALV-005/006).
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
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly provisioning: OwnSiteProvisioningService,
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

      const { site } = await this.provisioning.provision(
        tx,
        { tenantId, userId: actor.id, practitionerProfileId },
        dto,
        actor.id,
      );

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
        isOwnSite: true,
        bankQrFileId: site.bankQrFileId ?? null,
        status: site.statusConceptId,
      };
    });
  }

  /**
   * P32-b: corrige el consultorio **propio** del profesional autenticado.
   *
   * Hasta acá el consultorio se podía crear y retirar, no corregir: un nombre
   * mal tipeado o una mudanza obligaban a retirarlo y crear otro, y eso cambia
   * el `id` que la agenda referencia en cada turno.
   *
   * Sólo alcanza a la práctica personal. Una sede de otra organización no se
   * corrige desde acá: es de ella, y lo que el profesional tiene con ella es
   * una vinculación, no la sede.
   *
   * @param actor - El profesional autenticado.
   * @param siteId - El consultorio a corregir.
   * @param dto - Sólo los campos que cambian; lo que no viaja no se toca.
   * @returns La sede con los cambios aplicados, en el formato de la lista.
   * @throws ResourceNotFoundException si la sede no es un consultorio propio del actor.
   */
  async updateOwnSite(
    actor: AuthenticatedUser,
    siteId: string,
    dto: UpdateOwnSiteDto,
  ): Promise<PractitionerSiteDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const site = await this.requireOwnSite(tx, actor, siteId, tenantId);

      if (dto.name !== undefined) site.name = dto.name;
      if (dto.timeZone !== undefined) site.timeZone = dto.timeZone;
      if (dto.address) {
        site.addressId = await this.moveAddress(
          tx,
          site,
          dto.address,
          actor.id,
        );
      }
      touch(site, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'practice.sites.updateOwn', siteId },
        'Practitioner own site updated',
      );
      return this.projectSite(tx, site, true);
    });
  }

  /**
   * P33: fija —o quita— el QR bancario con el que el profesional cobra en una sede.
   *
   * La autorización es **«tengo una asignación de rol vigente en esta sede»**,
   * no «soy el dueño de la práctica»: el QR también se configura en la clínica
   * donde el profesional atiende sin ser dueño del lugar, porque lo que se
   * guarda ahí no es la sede, es con qué cobra él en ella.
   *
   * @param actor - El profesional autenticado.
   * @param siteId - La sede donde se cobra con ese QR.
   * @param fileId - El archivo ya subido, o `null` para dejarla sin QR.
   * @returns La sede con el QR aplicado, en el formato de la lista.
   * @throws ResourceNotFoundException si el actor no tiene vinculación vigente con esa sede.
   */
  async setSiteBankQr(
    actor: AuthenticatedUser,
    siteId: string,
    fileId: string | null,
  ): Promise<PractitionerSiteDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const practitionerProfileId =
        await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const assignment = await this.rolesRepo.findCurrentBySite(
        tx,
        practitionerProfileId,
        siteId,
      );
      const site = assignment
        ? await this.sitesRepo.findById(tx, siteId)
        : null;
      if (!site) {
        throw new ResourceNotFoundException(
          'No tenés una vinculación vigente con esa sede',
          { siteId },
        );
      }

      // `undefined` y no `null`: la propiedad de la entidad es opcional, y
      // MikroORM traduce la ausencia a `NULL` en la columna.
      site.bankQrFileId = fileId ?? undefined;
      touch(site, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'practice.sites.setBankQr',
          siteId,
          cleared: fileId === null,
        },
        'Practitioner site bank QR updated',
      );
      return this.projectSite(
        tx,
        site,
        await this.isOwnPractice(tx, site.practiceId, actor.id, tenantId),
      );
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
    // P32-a: isOwnSite compara contra la cuenta del profesional consultado,
    // así que hace falta resolverla una vez, no una por sede.
    const link = await this.accountLinksRepo.findActiveByPerson(
      em,
      practitionerProfileId,
    );
    const sites = await this.loadSites(em, siteIds, tenantId, link?.userId);

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
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param siteIds - Las sedes a resolver.
   * @param tenantId - Organización del contexto.
   * @param ownerUserId - La cuenta cuyo consultorio propio hay que distinguir
   *   (P32-a). Sin ella, `isOwnSite` sale `false` en todas: es la lectura
   *   prudente —ajeno mientras no conste lo contrario— y la que corresponde a
   *   las llamadas que no preguntan por una persona, como la resolución de
   *   recursos de la agenda.
   * @returns Un mapa de sede a proyección, sin entrada para lo descartado.
   */
  private async loadSites(
    em: EntityManager,
    siteIds: readonly string[],
    tenantId: string,
    ownerUserId?: string,
  ): Promise<Map<string, PractitionerSiteDto>> {
    const resultado = new Map<string, PractitionerSiteDto>();
    if (siteIds.length === 0) return resultado;

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
      const isOwnSite =
        ownerUserId !== undefined &&
        practice.typeConceptId === PRAC.PRACTICE_TYPE_OFFICE &&
        practice.adminUserId === ownerUserId;
      resultado.set(site.id, await this.projectSite(em, site, isOwnSite));
    }
    return resultado;
  }

  /**
   * La proyección de una sede al DTO de lectura, en un solo lugar.
   *
   * Existe porque la misma forma la devuelven cuatro caminos —el listado, el
   * alta, la corrección y el QR— y tenerla escrita cuatro veces garantizaba
   * que el día que se agregara un campo alguno se quedara sin él.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param site - La sede a proyectar.
   * @param isOwnSite - Si es el consultorio propio de quien pregunta.
   * @returns La sede en el formato que devuelve el listado.
   */
  private async projectSite(
    em: EntityManager,
    site: PracticeSites,
    isOwnSite: boolean,
  ): Promise<PractitionerSiteDto> {
    const address = site.addressId
      ? await em.findOne(Addresses, { id: site.addressId })
      : null;
    return {
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
      isOwnSite,
      bankQrFileId: site.bankQrFileId ?? null,
      status: site.statusConceptId,
    };
  }

  /**
   * La sede, sólo si es el consultorio propio del actor (P32-b).
   *
   * Responde 404 y no 403 a propósito: quien no es dueño de la sede tampoco
   * tiene por qué enterarse de que existe.
   *
   * @param em - Transacción activa.
   * @param actor - El profesional autenticado.
   * @param siteId - La sede pedida.
   * @param tenantId - Organización del contexto.
   * @returns La sede, ya cargada en la transacción.
   * @throws ResourceNotFoundException si no es un consultorio propio del actor.
   */
  private async requireOwnSite(
    em: EntityManager,
    actor: AuthenticatedUser,
    siteId: string,
    tenantId: string,
  ): Promise<PracticeSites> {
    const site = await this.sitesRepo.findById(em, siteId);
    const esPropia =
      site !== null &&
      (await this.isOwnPractice(em, site.practiceId, actor.id, tenantId));
    if (!site || !esPropia) {
      throw new ResourceNotFoundException(
        'Esa sede no es un consultorio propio tuyo',
        { siteId },
      );
    }
    return site;
  }

  /**
   * Indica si esa práctica es la personal del actor.
   *
   * La práctica personal es única por cuenta —tipo consultorio y él como
   * cuenta administradora—, que es exactamente lo que
   * `OwnSiteProvisioningService` busca antes de crearla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - La práctica a comparar.
   * @param userId - La cuenta del actor.
   * @param tenantId - Organización del contexto.
   * @returns Si la práctica es el consultorio propio de esa cuenta.
   */
  private async isOwnPractice(
    em: EntityManager,
    practiceId: string,
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const office = await this.practicesRepo.findOwnOffice(
      em,
      tenantId,
      userId,
      PRAC.PRACTICE_TYPE_OFFICE,
    );
    return office !== null && office.id === practiceId;
  }

  /**
   * Muda el consultorio: cierra la dirección vigente y archiva la nueva.
   *
   * La anterior no se borra —es donde el consultorio estaba— sino que se le
   * pone fin de vigencia, el mismo criterio con el que se mudan las personas.
   * La dirección se archiva como de trabajo (`ADDR_USE_WORK`): es donde el
   * profesional atiende, no su domicilio.
   *
   * @param em - Transacción activa.
   * @param site - La sede que se muda.
   * @param address - La dirección nueva tal como llegó en el cuerpo.
   * @param actorUserId - Quién queda como autor del cambio.
   * @returns El identificador de la dirección nueva.
   */
  private async moveAddress(
    em: EntityManager,
    site: PracticeSites,
    address: OwnSiteAddressDto,
    actorUserId: string,
  ): Promise<string> {
    if (site.addressId) {
      const vigente = await em.findOne(Addresses, { id: site.addressId });
      if (vigente) {
        this.addressesRepo.closeVigente(vigente, new Date(), actorUserId);
      }
    }

    // Una línea en blanco no es una dirección ausente: es una fila vacía.
    // Mismo criterio que el alta (`OwnSiteProvisioningService.provision`).
    const lines = address.lines
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);
    const nueva = this.addressesRepo.create(em, {
      ownerTypeConceptId: CONCEPTS.OWNER_USER,
      ownerId: actorUserId,
      lines: lines.length > 0 ? lines.join('\n') : undefined,
      city: address.city,
      municipalityConceptId: address.municipalityConceptId,
      administrativeAreaConceptId: address.administrativeAreaConceptId,
      countryConceptId: CONCEPTS.COUNTRY_BO,
      useConceptId: CONCEPTS.ADDR_USE_WORK,
      typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
      latitude:
        address.latitude !== undefined ? String(address.latitude) : undefined,
      longitude:
        address.longitude !== undefined ? String(address.longitude) : undefined,
      actorUserId,
    });
    await em.flush();
    return nueva.id;
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
