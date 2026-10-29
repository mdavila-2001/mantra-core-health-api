import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { forbiddenWithReason } from '../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../common/errors/system-error-reasons';
import { TenantAdministrationService } from '../../directory/services';
import { BranchesRepository } from '../../directory/repositories/branches.repository';
import { HistoryRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';
import { PRAC } from '../practice.concepts';
import { loadPracticeInScope, practiceOutOfScope } from './practice-scope';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';
import { PracticeAccessService } from './practice-access.service';
import { DEFAULT_APPOINTMENT_SERVICE } from '../../billing/default-services';
import { ServiceCatalogRepository } from '../../billing/repositories';
import {
  PracticesRepository,
  PracticeSitesRepository,
  ClinicalUnitsRepository,
  CareSpacesRepository,
  HealthcareServicesRepository,
  PractitionerRoleAssignmentsRepository,
} from '../repositories';
import {
  CreatePracticeDto,
  CreateSiteDto,
  PracticeResponseDto,
  PracticeSummaryDto,
  SiteResponseDto,
  SiteSummaryDto,
  CareSpaceSummaryDto,
  StatusResultDto,
} from '../dto';

/**
 * Casos de uso de organización y sitios: alta de la práctica raíz (bootstrap),
 * alta de sitios (UC-14-01) y desmantelamiento en cascada (UC-14-12).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos, ya que las FK son columnas uuid planas y MikroORM
 * no ordena inserts entre entidades no relacionadas.
 */
/**
 * Quién puede **listar** las prácticas del tenant y sus sedes, además de quien administra la organización.
 *
 * Son los roles que antes declaraba `@Roles(...)` en el controlador; ahora el servicio los evalúa junto con la
 * membresía de administración (A-6), porque un `@Roles` global no ve que alguien es `OWNER` o `ADMIN` de **esa**
 * organización y le respondía 403 al dueño de un centro recién registrado.
 */
const PRACTICE_LIST_ROLES = [
  'SECURITY_ADMIN',
  'SURGERY_SCHEDULER',
  'PERIOP_ADMIN',
  'SURGEON',
  'ANESTHESIOLOGIST',
  'PERIOP_NURSE',
  'SCHEDULING_ADMIN',
  // Los roles clínicos generales: sin ellos un médico no puede ni saber en qué práctica trabaja.
  'PRACTITIONER',
  'CLINICIAN',
  'ACCOUNTING_APPROVER',
] as const;

const SITE_LIST_ROLES = [
  'SECURITY_ADMIN',
  'SURGERY_SCHEDULER',
  'PERIOP_ADMIN',
  'SURGEON',
  'ANESTHESIOLOGIST',
  'PERIOP_NURSE',
  'SCHEDULING_ADMIN',
] as const;

@Injectable()
export class PracticeSitesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practicesRepo - Valor de practices repo requerido por la operación.
   * @param sitesRepo - Valor de sites repo requerido por la operación.
   * @param unitsRepo - Valor de units repo requerido por la operación.
   * @param spacesRepo - Valor de spaces repo requerido por la operación.
   * @param servicesRepo - Valor de services repo requerido por la operación.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param branchesRepo - Sucursales del directorio, para validar `branchId`.
   * @param historyRepo - Versionado append-only en `audit.*_history`.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly servicesRepo: HealthcareServicesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly logger: PinoLogger,
    private readonly access: PracticeAccessService,
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly branchesRepo: BranchesRepository,
    private readonly historyRepo: HistoryRepository,
  ) {
    this.logger.setContext(PracticeSitesService.name);
  }

  /** Bootstrap: da de alta la organización raíz (práctica). */
  async createPractice(
    dto: CreatePracticeDto,
    actor: AuthenticatedUser,
  ): Promise<PracticeResponseDto> {
    // El tenant sale del contexto verificado; el del cuerpo no es fuente de verdad.
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'practice.create', actorId: actor.id },
      'Creating practice',
    );
    return this.em.transactional(async (tx) => {
      const practice = this.practicesRepo.create(tx, {
        tenantId,
        code: dto.code,
        name: dto.name,
        typeConceptId: dto.typeConceptId ?? PRAC.PRACTICE_TYPE_CLINIC,
        adminUserId: dto.adminUserId ?? actor.id,
        currencyConceptId: dto.currencyConceptId,
        timeZone: dto.timeZone,
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Toda práctica nace ofreciendo una consulta (FT-22-R01). En la misma
      // transacción: una organización a la que le falló el catálogo no tiene
      // nada que mostrarle a quien atiende, y arreglarlo después exige saber
      // que hacía falta.
      this.serviceCatalogRepo.create(tx, {
        practiceId: practice.id,
        code: DEFAULT_APPOINTMENT_SERVICE.code,
        name: DEFAULT_APPOINTMENT_SERVICE.name,
        defaultPrice: DEFAULT_APPOINTMENT_SERVICE.defaultPrice,
        currencyConceptId: DEFAULT_APPOINTMENT_SERVICE.currencyConceptId,
        isActive: true,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'practice.create', practiceId: practice.id },
        'Practice created',
      );
      return {
        id: practice.id,
        code: practice.code,
        status: practice.statusConceptId,
        createdAt: practice.createdAt,
      };
    });
  }

  /** UC-14-01: da de alta un sitio de práctica bajo una práctica activa. */
  /**
   * Prácticas activas del tenant.
   *
   * `practice` no exponía ninguna lectura y todas sus altas son de
   * `SECURITY_ADMIN`: la estructura física existía y nadie podía consultarla,
   * de modo que el `operatingRoomId` que exige programar una intervención había
   * que averiguarlo fuera del sistema.
   *
   * El tenant no basta para aislar a un `PRACTITIONER`: los médicos
   * auto-registrados comparten el tenant `DEFAULT`, así que a él sólo se le
   * listan las prácticas donde tiene una vinculación ACTIVE
   * (`PracticeAccessService`) **y su consultorio propio**.
   *
   * El consultorio propio se lista aunque no haya vinculación ACTIVE que lo
   * pruebe (vinculación cerrada o pendiente, perfil profesional ausente del
   * token): es la práctica que `BillingServiceCatalogService` le deja tocar —
   * `isOwnOffice`: tipo consultorio y él como administrador— y un selector de
   * «a qué práctica importo» que no la mostrara dejaba al médico sin opciones
   * en la única práctica donde sí puede dar de alta servicios. Lo que ese alta
   * permite, esta lista lo muestra; no se abre nada que no estuviera abierto.
   *
   * @param tenantId - Tenant del contexto.
   * @param actor - Actor autenticado, para acotar lo que ve un profesional.
   * @returns Las prácticas activas que el actor puede ver.
   */
  async listPractices(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<PracticeSummaryDto[]> {
    const administers = await this.assertCanReadPractices(
      tenantId,
      actor,
      PRACTICE_LIST_ROLES,
    );
    const [practices, allowed] = await Promise.all([
      this.practicesRepo.findByTenant(this.em, tenantId, PRAC.PRACTICE_ACTIVE),
      // Quien administra la organización ve todas las suyas: el filtro por
      // vinculación es para el profesional, que sólo ve donde trabaja.
      administers
        ? Promise.resolve(null)
        : this.access.allowedPracticeIds(actor),
    ]);
    return practices
      .filter(
        (p) =>
          allowed === null || allowed.has(p.id) || isOwnOfficeOf(p, actor.id),
      )
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.statusConceptId,
      }));
  }

  /**
   * Sedes de una práctica.
   *
   * @param practiceId - Práctica consultada.
   * @param tenantId - Tenant del contexto, que debe ser el dueño.
   * @returns Sus sedes.
   * @throws ResourceNotFoundException si la práctica no existe o es de otro tenant.
   */
  async listSites(
    practiceId: string,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<SiteSummaryDto[]> {
    await this.assertCanReadPractices(tenantId, actor, SITE_LIST_ROLES);
    const practice = await this.practicesRepo.findById(this.em, practiceId);
    // Comprobar el tenant aquí y no sólo filtrar evita responder una lista
    // vacía —indistinguible de "no tiene sedes"— cuando la práctica es de otra
    // organización.
    if (!practice || practice.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    }
    const sites = await this.sitesRepo.findByPractice(this.em, practiceId);
    return sites.map((s) => ({
      id: s.id,
      practiceId: s.practiceId,
      code: s.code,
      name: s.name,
      status: s.statusConceptId,
    }));
  }

  /**
   * Espacios de atención de una sede (quirófanos, consultas, boxes).
   *
   * @param siteId - Sede consultada.
   * @param tenantId - Tenant del contexto, que debe ser el dueño.
   * @returns Sus espacios.
   * @throws ResourceNotFoundException si la sede no existe o es de otro tenant.
   */
  async listCareSpaces(
    siteId: string,
    tenantId: string,
  ): Promise<CareSpaceSummaryDto[]> {
    const site = await this.sitesRepo.findById(this.em, siteId);
    if (!site) {
      throw new ResourceNotFoundException('Sede no encontrada', { siteId });
    }
    const practice = await this.practicesRepo.findById(
      this.em,
      site.practiceId,
    );
    if (!practice || practice.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Sede no encontrada', { siteId });
    }
    const spaces = await this.spacesRepo.findBySite(this.em, siteId);
    return spaces.map((s) => ({
      id: s.id,
      practiceSiteId: s.practiceSiteId,
      code: s.code,
      name: s.name,
      spaceTypeConceptId: s.spaceTypeConceptId,
      status: s.statusConceptId,
    }));
  }

  /**
   * UC-14-01: da de alta un sitio de práctica bajo una práctica activa.
   *
   * La práctica tiene que ser del tenant activo (404 si no) y el actor tiene
   * que poder administrarlo (`TenantAdministrationService`, 403 si no). Un
   * `branchId` declarado tiene que ser una sucursal **del mismo tenant**: si no
   * existe o es de otro tenant responde el mismo 404 (INV-02), para no revelar
   * que el id existe en otra organización.
   */
  async createSite(
    practiceId: string,
    dto: CreateSiteDto,
    actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'practice.site.create', practiceId, actorId: actor.id },
      'Creating site',
    );
    return this.em.transactional(async (tx) => {
      const practice = await loadPracticeInScope(
        this.practicesRepo,
        tx,
        practiceId,
        tenantId,
      );
      await this.tenantAdministration.assertCanAdminister(tx, tenantId, actor);
      if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
        throw new PreconditionFailedException('La práctica no está activa', {
          practiceId,
        });
      }

      if (dto.branchId) {
        const branch = await this.branchesRepo.findById(tx, dto.branchId);
        if (!branch || branch.tenantId !== tenantId) {
          throw practiceOutOfScope('Sucursal no encontrada');
        }
      }

      const clash = await this.sitesRepo.findByPracticeAndCode(
        tx,
        practiceId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe un sitio con ese código en la práctica',
          {
            practiceId,
            code: dto.code,
          },
        );
      }

      const site = this.sitesRepo.create(tx, {
        practiceId,
        code: dto.code,
        name: dto.name,
        siteTypeConceptId: dto.siteTypeConceptId ?? PRAC.SITE_TYPE_HOSPITAL,
        physicalTypeConceptId: dto.physicalTypeConceptId,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        timeZone: dto.timeZone,
        addressId: dto.addressId,
        branchId: dto.branchId,
        managingTenantId: dto.managingTenantId,
        statusConceptId: PRAC.SITE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.site, site.id, {
        operationConceptId: AUD.OPERATION_INSERT,
        dataSnapshot: structureSnapshot(site),
        changedByUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'practice.site.create', siteId: site.id },
        'Site created',
      );
      return {
        id: site.id,
        practiceId: site.practiceId,
        code: site.code,
        status: site.statusConceptId,
        operationalStatus: site.operationalStatusConceptId!,
        createdAt: site.createdAt,
      };
    });
  }

  /** UC-14-12: desmantela un sitio y hace soft-delete en cascada de sus hijos. */
  async decommissionSite(
    practiceId: string,
    siteId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'practice.site.decommission', practiceId, siteId },
      'Decommissioning site',
    );
    return this.em.transactional(async (tx) => {
      // La práctica primero: la sede se resuelve dentro de una práctica del
      // tenant activo (una sede de otra práctica es, para este actor, inexistente).
      await loadPracticeInScope(this.practicesRepo, tx, practiceId, tenantId);
      await this.tenantAdministration.assertCanAdminister(tx, tenantId, actor);
      const site = await this.sitesRepo.findById(tx, siteId);
      if (!site || site.practiceId !== practiceId) {
        throw new ResourceNotFoundException(
          'Sitio no encontrado en la práctica',
          { practiceId, siteId },
        );
      }
      if (site.statusConceptId === PRAC.SITE_RETIRED) {
        throw new ConflictException('El sitio ya está retirado', { siteId });
      }

      // Sitio: ACTIVE -> RETIRED, operacional -> CLOSED.
      site.statusConceptId = PRAC.SITE_RETIRED;
      site.operationalStatusConceptId = PRAC.SITE_OP_CLOSED;
      touch(site, actor.id);

      const today = new Date();

      const units = await this.unitsRepo.findBySite(tx, siteId);
      for (const unit of units) {
        unit.statusConceptId = PRAC.UNIT_RETIRED;
        touch(unit, actor.id);
      }

      const spaces = await this.spacesRepo.findBySite(tx, siteId);
      for (const space of spaces) {
        space.statusConceptId = PRAC.SPACE_RETIRED;
        space.operationalStatusConceptId = PRAC.SPACE_OP_CLOSED;
        touch(space, actor.id);
      }

      const services = await this.servicesRepo.findBySite(tx, siteId);
      for (const svc of services) {
        svc.statusConceptId = PRAC.SERVICE_SUSPENDED;
        touch(svc, actor.id);
      }

      const roles = await this.rolesRepo.findBySite(tx, siteId);
      for (const role of roles) {
        role.statusConceptId = PRAC.ROLE_ASSIGNMENT_ENDED;
        role.validTo = today;
        touch(role, actor.id);
      }

      // Una revisión por fila que el desmantelamiento cambió: la cascada es
      // la mutación de mayor alcance de la estructura y tiene que poder
      // reconstruirse punto a punto (`valid_to` cierra la revisión previa).
      const revision = { changedByUserId: actor.id };
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.site, site.id, {
        ...revision,
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: structureSnapshot(site),
      });
      for (const unit of units) {
        await this.historyRepo.append(tx, STRUCTURE_HISTORY.unit, unit.id, {
          ...revision,
          operationConceptId: AUD.OPERATION_UPDATE,
          dataSnapshot: structureSnapshot(unit),
        });
      }
      for (const space of spaces) {
        await this.historyRepo.append(tx, STRUCTURE_HISTORY.space, space.id, {
          ...revision,
          operationConceptId: AUD.OPERATION_UPDATE,
          dataSnapshot: structureSnapshot(space),
        });
      }

      await tx.flush();
      this.logger.info(
        {
          operation: 'practice.site.decommission',
          siteId,
          units: units.length,
          spaces: spaces.length,
          services: services.length,
          roles: roles.length,
        },
        'Site decommissioned in cascade',
      );
      return { ok: true };
    });
  }

  /**
   * Exige que el actor pueda leer las prácticas o las sedes del tenant: un rol de la lista, el comodín
   * `SUPERADMIN` de plataforma, o ser `OWNER`/`ADMIN` activo de ese tenant por su membresía. Un rol de
   * plataforma acotado a otro tenant (`scopedRoles`) no autoriza acá, igual que no autorizaba en el `RolesGuard`.
   *
   * La respuesta para quien no cumple es el mismo 403 `ROLE_INSUFFICIENT` que daba el `RolesGuard`, de modo que
   * el contrato de error no cambia. El tenant es el del contexto verificado, nunca uno que venga en la petición.
   *
   * @param tenantId - Tenant del contexto.
   * @param actor - Quien pide la lista.
   * @param roles - Roles que ya podían leer, además de la administración.
   * @returns `true` si pasa por administrar la organización y no por un rol de la lista.
   * @throws ForbiddenException (`ROLE_INSUFFICIENT`) si no cumple ninguna de las tres.
   */
  private async assertCanReadPractices(
    tenantId: string,
    actor: AuthenticatedUser,
    roles: readonly string[],
  ): Promise<boolean> {
    const byRole =
      roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined) ||
      roles.some((role) => roleAuthorizesInTenant(actor, role, tenantId));
    // Sólo la membresía: los roles de plataforma ya se evaluaron arriba con el ámbito de `scopedRoles`.
    const administers = await this.tenantAdministration.administersByMembership(
      this.em,
      tenantId,
      actor,
    );
    if (!byRole && !administers) {
      throw forbiddenWithReason(
        'Rol insuficiente para la operación',
        SystemErrorReason.ROLE_INSUFFICIENT,
      );
    }
    return administers;
  }
}

/**
 * ¿Es esta práctica el consultorio propio de ese usuario?
 *
 * La misma regla que `PracticeTenantLookupService.isOwnOffice` —práctica de tipo
 * consultorio con el usuario como administrador—, aplicada a una fila ya leída
 * para no hacer una consulta por práctica.
 */
function isOwnOfficeOf(
  practice: { adminUserId?: string; typeConceptId?: string },
  userId: string,
): boolean {
  return (
    practice.adminUserId === userId &&
    practice.typeConceptId === PRAC.PRACTICE_TYPE_OFFICE
  );
}
