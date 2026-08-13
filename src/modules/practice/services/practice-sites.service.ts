import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  getCurrentTenantId,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../practice.concepts';
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
  PracticeListResponseDto,
  PracticeResponseDto,
  SiteResponseDto,
  StatusResultDto,
} from '../dto';

/** Tope del listado de prácticas: una organización no tiene cientos. */
const TOPE_DE_PRACTICAS = 200;

/**
 * Casos de uso de organización y sitios: alta de la práctica raíz (bootstrap),
 * alta de sitios (UC-14-01) y desmantelamiento en cascada (UC-14-12).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos, ya que las FK son columnas uuid planas y MikroORM
 * no ordena inserts entre entidades no relacionadas.
 */
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
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly servicesRepo: HealthcareServicesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeSitesService.name);
  }

  /**
   * Las prácticas del tenant activo — la lectura que el módulo no tenía.
   *
   * Sin esto no hay forma de elegir una práctica en pantalla, y sin
   * `practiceId` no se puede pedir ni el plan de cuentas ni el diario ni el
   * balance: el módulo contable quedaba inalcanzable aunque sus lecturas ya
   * existieran.
   *
   * Acota por el tenant del contexto y no por un parámetro: quien pregunta ya
   * declaró de qué organización habla en `X-Tenant-Id`, y el guard verificó que
   * pertenece a ella. Aceptarlo por query sería ofrecer el listado de
   * cualquiera a quien supiera escribir otro uuid.
   */
  async listPractices(): Promise<PracticeListResponseDto> {
    const tenantId = getCurrentTenantId();
    if (tenantId === undefined) {
      return { items: [], count: 0 };
    }

    const practicas = await this.practicesRepo.findByTenant(
      this.em.fork(),
      tenantId,
      TOPE_DE_PRACTICAS,
    );

    return {
      items: practicas.map((practica) => ({
        id: practica.id,
        code: practica.code,
        name: practica.name,
        typeConceptId: practica.typeConceptId,
        statusConceptId: practica.statusConceptId,
        currencyConceptId: practica.currencyConceptId ?? null,
        timeZone: practica.timeZone ?? null,
      })),
      count: practicas.length,
    };
  }

  /** Bootstrap: da de alta la organización raíz (práctica). */
  async createPractice(
    dto: CreatePracticeDto,
    actor: AuthenticatedUser,
  ): Promise<PracticeResponseDto> {
    this.logger.info(
      { operation: 'practice.create', actorId: actor.id },
      'Creating practice',
    );
    return this.em.transactional(async (tx) => {
      const practice = this.practicesRepo.create(tx, {
        tenantId: dto.tenantId,
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
  async createSite(
    practiceId: string,
    dto: CreateSiteDto,
    actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    this.logger.info(
      { operation: 'practice.site.create', practiceId, actorId: actor.id },
      'Creating site',
    );
    return this.em.transactional(async (tx) => {
      const practice = await this.practicesRepo.findById(tx, practiceId);
      if (!practice)
        throw new ResourceNotFoundException('Práctica no encontrada', {
          practiceId,
        });
      if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
        throw new PreconditionFailedException('La práctica no está activa', {
          practiceId,
        });
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
    this.logger.info(
      { operation: 'practice.site.decommission', practiceId, siteId },
      'Decommissioning site',
    );
    return this.em.transactional(async (tx) => {
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
}
