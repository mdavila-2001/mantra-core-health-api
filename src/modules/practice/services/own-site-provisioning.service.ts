import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import { AddressesRepository } from '../../common/repositories';
import { PRAC } from '../practice.concepts';
import {
  PracticeSitesRepository,
  PracticesRepository,
  PractitionerRoleAssignmentsRepository,
} from '../repositories';
import type { CreateOwnSiteDto } from '../dto';
import type { PracticeSites } from '../entities';
import { siteCodeBase, uniqueCode } from '../site-code';

/**
 * A quién pertenece el consultorio que se va a provisionar: el tenant en el
 * que nace la práctica, la cuenta dueña (`practices.admin_user_id`) y el
 * perfil profesional que queda vinculado a la sede.
 *
 * Es la parte que cambia según quién llama: `/me/sites` los resuelve del
 * actor autenticado; el alta pública los resuelve de la cuenta y la persona
 * que acaba de crear en la misma transacción.
 */
export interface OwnSiteOwner {
  readonly tenantId: string;
  readonly userId: string;
  readonly practitionerProfileId: string;
}

/** Lo que dejó escrito {@link OwnSiteProvisioningService.provision}. */
export interface ProvisionedOwnSite {
  readonly practiceId: string;
  readonly siteId: string;
  readonly addressId?: string;
  readonly site: PracticeSites;
}

/**
 * Alta de un consultorio propio (ALV-005/006 · P20): práctica personal
 * (reutilizada si ya existe), dirección opcional y sede, más la asignación
 * de rol que conecta al profesional con su agenda.
 *
 * Se extrajo de `PractitionerSitesService.createOwnSite` para que el mismo
 * caso de uso sirva a `POST /practitioners/me/sites` (con sesión, tenant del
 * request) y al auto-registro de profesional (`POST
 * /iam/auth/register-practitioner`, público y sin tenant en contexto): acá
 * no se resuelve tenant ni actor, se reciben ya resueltos, y **no se abre
 * transacción propia** — escribe en la que el llamador ya tiene abierta.
 */
@Injectable()
export class OwnSiteProvisioningService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param practicesRepo - Prácticas, para buscar-o-crear la personal.
   * @param sitesRepo - Sedes.
   * @param rolesRepo - Asignaciones de rol, para conectar la sede a la agenda.
   * @param addressesRepo - Direcciones de la sede.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OwnSiteProvisioningService.name);
  }

  /**
   * Da de alta el consultorio propio dentro de `tx`.
   *
   * La práctica personal es idempotente por profesional: la segunda sede que
   * agregue cuelga de la MISMA práctica, no de una nueva. La dirección se
   * archiva como dirección de **trabajo** (`ADDR_USE_WORK`): es donde el
   * profesional atiende, no su domicilio.
   *
   * @param tx - Transacción activa del llamador. No se abre ninguna acá.
   * @param owner - Tenant, cuenta y perfil profesional ya persistidos.
   * @param dto - Nombre, huso horario y dirección opcional del consultorio.
   * @param actorUserId - Quién queda como autor de las filas nuevas.
   * @returns Los identificadores de lo creado y la sede recién persistida.
   */
  async provision(
    tx: EntityManager,
    owner: OwnSiteOwner,
    dto: CreateOwnSiteDto,
    actorUserId: string,
  ): Promise<ProvisionedOwnSite> {
    let practice = await this.practicesRepo.findOwnOffice(
      tx,
      owner.tenantId,
      owner.userId,
      PRAC.PRACTICE_TYPE_OFFICE,
    );
    if (!practice) {
      practice = this.practicesRepo.create(tx, {
        tenantId: owner.tenantId,
        // Determinista y único por usuario: dos altas del mismo profesional
        // deben resolver a la MISMA práctica, no chocar por código.
        code: `OFFICE-${owner.userId}`,
        name: 'Consultorio propio',
        typeConceptId: PRAC.PRACTICE_TYPE_OFFICE,
        adminUserId: owner.userId,
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        actorUserId,
      });
      await tx.flush();
    }

    let addressId: string | undefined;
    if (dto.address) {
      // Una línea en blanco no es «sin dirección»: es una fila vacía en
      // `common.addresses`. Si no queda nada tras recortar, la columna
      // (varchar nullable) se deja sin valor en vez de guardar `''`.
      const lines = dto.address.lines
        .map((linea) => linea.trim())
        .filter((linea) => linea.length > 0);
      const address = this.addressesRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_USER,
        ownerId: owner.userId,
        lines: lines.length > 0 ? lines.join('\n') : undefined,
        city: dto.address.city,
        municipalityConceptId: dto.address.municipalityConceptId,
        administrativeAreaConceptId: dto.address.administrativeAreaConceptId,
        countryConceptId: CONCEPTS.COUNTRY_BO,
        useConceptId: CONCEPTS.ADDR_USE_WORK,
        typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
        latitude:
          dto.address.latitude !== undefined
            ? String(dto.address.latitude)
            : undefined,
        longitude:
          dto.address.longitude !== undefined
            ? String(dto.address.longitude)
            : undefined,
        actorUserId,
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
      managingTenantId: owner.tenantId,
      statusConceptId: PRAC.SITE_ACTIVE,
      actorUserId,
    });
    await tx.flush();

    this.rolesRepo.create(tx, {
      practitionerProfileId: owner.practitionerProfileId,
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
      actorUserId,
    });
    await tx.flush();

    this.logger.info(
      { operation: 'practice.sites.provisionOwn', siteId: site.id },
      'Own site provisioned',
    );
    return { practiceId: practice.id, siteId: site.id, addressId, site };
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
    return uniqueCode(
      siteCodeBase(name, 'CONSULTORIO'),
      async (candidate) =>
        (await this.sitesRepo.findByPracticeAndCode(
          em,
          practiceId,
          candidate,
        )) !== null,
    );
  }
}
