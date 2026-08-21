import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';
import {
  BranchMembershipsRepository,
  BranchesRepository,
  TenantMembershipsRepository,
  TenantsRepository,
} from '../repositories';
import { TenantAdministrationService } from './tenant-administration.service';
import { CatalogRepository } from '../../insurance/repositories';
import { DIR, TENANT_TYPE_CONCEPT_BY_CODE } from '../directory.concepts';
import type {
  ListBranchAssignmentsResponseDto,
  ListBranchesResponseDto,
  MyOrganizationDto,
  MyOrganizationsResponseDto,
  SearchMembershipsResponseDto,
  SearchTenantsResponseDto,
  TenantDetailResponseDto,
} from '../dto';

/**
 * Los roles de organización que la administran.
 *
 * Copia deliberada del criterio de `TenantAdministrationService`: allí decide
 * si una escritura pasa, y acá sólo rotula lo que la pantalla puede ofrecer.
 * Son dos preguntas distintas sobre el mismo hecho, y la que autoriza sigue
 * siendo la de allá.
 */
const ROLES_QUE_ADMINISTRAN = new Set<string>([DIR.ROLE_OWNER, DIR.ROLE_ADMIN]);

/**
 * Cara de lectura de `directory`: organizaciones, sus sub-organizaciones, sus
 * sucursales, su plantilla y las asignaciones de cada persona a cada sede.
 *
 * ## Aislamiento entre organizaciones
 *
 * Toda lectura acotada a un tenant pasa antes por
 * `TenantAdministrationService.assertCanRead`. No es una formalidad: un listado es
 * justo la forma en que un fallo de alcance se convierte en una fuga masiva, y el
 * rol global no basta —lo que decide es la membresía activa **en ese tenant**.
 *
 * El listado global de organizaciones no lleva esa comprobación porque no es de
 * tenant: se publica en `/admin/tenants`, que ya exige rol de plataforma.
 */
@Injectable()
export class DirectoryReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param tenantsRepo - Acceso a `directory.tenants`.
   * @param membershipsRepo - Acceso a `directory.tenant_memberships`.
   * @param branchesRepo - Acceso a `directory.branches`.
   * @param branchMembershipsRepo - Acceso a `directory.branch_memberships`.
   * @param tenantAdmin - Comprobación de alcance por organización.
   * @param catalogRepo - Acceso a `insurance.insurance_carriers`, para el bloque `payer`.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tenantsRepo: TenantsRepository,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly branchesRepo: BranchesRepository,
    private readonly branchMembershipsRepo: BranchMembershipsRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly catalogRepo: CatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DirectoryReadService.name);
  }

  /**
   * UC-04-01 (cara de lectura): listado de organizaciones de la plataforma.
   *
   * @param options - Texto, estado, cursor y tope.
   * @returns Página de organizaciones.
   */
  async searchTenants(options: {
    /** Texto libre sobre código, razón social y nombre comercial. */
    query?: string;
    /** Estado al que acotar. */
    statusConceptId?: string;
    /** Cursor opaco devuelto por la página anterior. */
    cursor?: string;
    /** Tope de filas de la página. */
    limit: number;
  }): Promise<SearchTenantsResponseDto> {
    const em = this.em.fork();
    return this.pageOfTenants(em, {
      query: options.query,
      statusConceptId: options.statusConceptId,
      cursor: options.cursor,
      limit: options.limit,
    });
  }

  /**
   * UC-04-03 (cara de lectura): sub-organizaciones de una organización.
   *
   * @param tenantId - Organización madre.
   * @param options - Cursor y tope.
   * @param actor - Quien pide la lectura.
   * @returns Página de sub-organizaciones.
   */
  async listChildTenants(
    tenantId: string,
    options: {
      /** Cursor opaco devuelto por la página anterior. */
      cursor?: string;
      /** Tope de filas de la página. */
      limit: number;
    },
    actor: AuthenticatedUser,
  ): Promise<SearchTenantsResponseDto> {
    const em = await this.forkForReadableTenant(tenantId, actor);
    return this.pageOfTenants(em, {
      parentTenantId: tenantId,
      cursor: options.cursor,
      limit: options.limit,
    });
  }

  /**
   * Ficha de una organización.
   *
   * @param tenantId - Organización a leer.
   * @param actor - Quien pide la lectura.
   * @returns Ficha de la organización.
   */
  async getTenantById(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<TenantDetailResponseDto> {
    const em = this.em.fork();
    const tenant = await this.tenantsRepo.findById(em, tenantId);
    if (!tenant) {
      throw new ResourceNotFoundException('Organización no encontrada', {
        tenantId,
      });
    }
    // La comprobación va después de resolver la fila para que un id inexistente
    // sea 404 y no 403: lo contrario permitiría sondear qué identificadores
    // existen midiendo qué código de error devuelven.
    await this.tenantAdmin.assertCanRead(em, tenantId, actor);

    return {
      id: tenant.id,
      code: tenant.code,
      legalName: tenant.legalName,
      tradeName: tenant.tradeName,
      tenantTypeConceptId: tenant.tenantTypeConceptId,
      statusConceptId: tenant.statusConceptId,
      verificationStatusConceptId: tenant.verificationStatusConceptId,
      parentTenantId: tenant.parentTenantId ?? null,
      createdAt: tenant.createdAt,
      legalEntityTypeConceptId: tenant.legalEntityTypeConceptId,
      countryConceptId: tenant.countryConceptId,
      jurisdictionConceptId: tenant.jurisdictionConceptId,
      dataResidencyRegionConceptId: tenant.dataResidencyRegionConceptId,
      currencyConceptId: tenant.currencyConceptId,
      timeZone: tenant.timeZone,
      updatedAt: tenant.updatedAt,
    };
  }

  /**
   * TP-1: las organizaciones del actor, sin que tenga que saber sus ids.
   *
   * ## Qué problema resuelve
   *
   * Todas las lecturas del directorio empiezan por un `tenantId` que hay que
   * traer de algún lado. Para la plataforma eso está bien —elige a cuál
   * mirar—, pero para quien administra su propia organización era un callejón:
   * la pantalla necesitaba el id para pedir la ficha, y el único lugar de donde
   * podía sacarlo era la ficha. El panel de la organización no podía abrirse
   * solo.
   *
   * ## Por qué devuelve una lista
   *
   * Porque una persona puede pertenecer a más de una organización, y elegir por
   * ella sería inventar cuál es «la» suya. Vacía es una respuesta legítima:
   * quien no pertenece a ninguna simplemente no tiene panel de organización.
   *
   * ## Por qué trae el rol
   *
   * Para que la pantalla se dibuje sin adivinar: un `staff` ve la organización
   * pero no los botones de editar ni de invitar. La autorización real la
   * vuelve a hacer el servidor en cada escritura — esto es para que la pantalla
   * no mienta, no para permitir nada.
   *
   * @param actor - Quien pregunta por lo suyo.
   * @returns Sus organizaciones con su rol en cada una.
   */
  async listMyTenants(
    actor: AuthenticatedUser,
  ): Promise<MyOrganizationsResponseDto> {
    const em = this.em.fork();

    const memberships = await this.membershipsRepo.findActiveByUser(
      em,
      actor.id,
      DIR.MEMBERSHIP_ACTIVE,
    );
    if (memberships.length === 0) return { items: [] };

    const items: MyOrganizationDto[] = [];
    for (const membership of memberships) {
      const tenant = await this.tenantsRepo.findById(em, membership.tenantId);
      // Una membresía viva contra una organización que ya no está no es un
      // error del que pregunta: se omite en vez de romperle el panel.
      if (!tenant) continue;

      // Los datos propios de la aseguradora sólo aplican a un tenant PAYER: el
      // resto no tiene fila en `insurance.insurance_carriers` que leer.
      let payer: MyOrganizationDto['payer'];
      if (tenant.tenantTypeConceptId === TENANT_TYPE_CONCEPT_BY_CODE.PAYER) {
        const carrier = await this.catalogRepo.findCarrierByTenantId(
          em,
          tenant.id,
        );
        if (carrier) {
          payer = {
            carrierCode: carrier.carrierCode,
            regulatorIdentifier: carrier.regulatorIdentifier ?? '',
            sigla: carrier.sigla ?? '',
            address: carrier.address ?? '',
          };
        }
      }

      items.push({
        id: tenant.id,
        code: tenant.code,
        legalName: tenant.legalName,
        tradeName: tenant.tradeName,
        tenantTypeConceptId: tenant.tenantTypeConceptId,
        statusConceptId: tenant.statusConceptId,
        verificationStatusConceptId: tenant.verificationStatusConceptId,
        parentTenantId: tenant.parentTenantId ?? null,
        createdAt: tenant.createdAt,
        legalEntityTypeConceptId: tenant.legalEntityTypeConceptId,
        countryConceptId: tenant.countryConceptId,
        jurisdictionConceptId: tenant.jurisdictionConceptId,
        dataResidencyRegionConceptId: tenant.dataResidencyRegionConceptId,
        currencyConceptId: tenant.currencyConceptId,
        timeZone: tenant.timeZone,
        updatedAt: tenant.updatedAt,
        myRoleConceptId: membership.tenantRoleConceptId,
        canAdminister: ROLES_QUE_ADMINISTRAN.has(
          membership.tenantRoleConceptId,
        ),
        isVerified:
          tenant.verificationStatusConceptId === CONCEPTS.TENANT_VERIFIED,
        ...(payer ? { payer } : {}),
      });
    }

    return { items };
  }

  /**
   * UC-04-04 (cara de lectura): plantilla de la organización.
   *
   * @param tenantId - Organización cuyas membresías se listan.
   * @param options - Estado, cursor y tope.
   * @param actor - Quien pide la lectura.
   * @returns Página de membresías.
   */
  async listMemberships(
    tenantId: string,
    options: {
      /** Estado al que acotar. */
      statusConceptId?: string;
      /** Cursor opaco devuelto por la página anterior. */
      cursor?: string;
      /** Tope de filas de la página. */
      limit: number;
    },
    actor: AuthenticatedUser,
  ): Promise<SearchMembershipsResponseDto> {
    const em = await this.forkForReadableTenant(tenantId, actor);

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterKey =
      typeof after?.createdAt === 'string' && typeof after?.id === 'string'
        ? { createdAt: new Date(after.createdAt), id: after.id }
        : undefined;

    // Se pide una fila de más para saber si hay página siguiente sin pagar un
    // COUNT sobre toda la tabla en cada página.
    const rows = await this.membershipsRepo.findPageByTenant(
      em,
      tenantId,
      { statusConceptId: options.statusConceptId, after: afterKey },
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const last = page.at(-1);
    return {
      items: page.map((membership) => ({
        id: membership.id,
        userId: membership.userId,
        tenantRoleConceptId: membership.tenantRoleConceptId,
        statusConceptId: membership.statusConceptId,
        accessScopeConceptId: membership.accessScopeConceptId,
        primaryBranchId: membership.primaryBranchId ?? null,
        startDate: membership.startDate ?? null,
        endDate: membership.endDate ?? null,
        createdAt: membership.createdAt,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * UC-04-02 (cara de lectura): sucursales de la organización.
   *
   * @param tenantId - Organización cuyas sucursales se listan.
   * @param actor - Quien pide la lectura.
   * @returns Sucursales ordenadas por código.
   */
  async listBranches(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<ListBranchesResponseDto> {
    const em = await this.forkForReadableTenant(tenantId, actor);
    const rows = await this.branchesRepo.findByTenant(em, tenantId);

    const items = rows.map((branch) => ({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      branchTypeConceptId: branch.branchTypeConceptId,
      statusConceptId: branch.statusConceptId,
      timeZone: branch.timeZone,
      createdAt: branch.createdAt,
    }));
    return { items, count: items.length };
  }

  /**
   * UC-04-05 (cara de lectura): sucursales asignadas a una membresía.
   *
   * @param tenantId - Organización a la que pertenece la membresía.
   * @param membershipId - Membresía cuyas asignaciones se listan.
   * @param actor - Quien pide la lectura.
   * @returns Asignaciones vigentes y cerradas.
   */
  async listBranchAssignments(
    tenantId: string,
    membershipId: string,
    actor: AuthenticatedUser,
  ): Promise<ListBranchAssignmentsResponseDto> {
    const em = await this.forkForReadableTenant(tenantId, actor);

    // La membresía se busca **dentro del tenant** y no por id suelto: sin esa
    // condición, pedir la membresía de otra organización desde un tenant que sí
    // se puede leer devolvería sus asignaciones.
    const membership = await this.membershipsRepo.findByIdInTenant(
      em,
      membershipId,
      tenantId,
    );
    if (!membership) {
      throw new ResourceNotFoundException('Membresía no encontrada', {
        tenantId,
        membershipId,
      });
    }

    const rows = await this.branchMembershipsRepo.findByMembership(
      em,
      membershipId,
    );

    const items = rows.map((assignment) => ({
      id: assignment.id,
      branchId: assignment.branchId,
      localRoleConceptId: assignment.localRoleConceptId,
      statusConceptId: assignment.statusConceptId,
      createdAt: assignment.createdAt,
    }));
    return { items, count: items.length };
  }

  /**
   * Página de organizaciones, compartida por el listado global y el de hijas.
   *
   * @param em - Contexto de persistencia ya abierto.
   * @param options - Filtros, cursor y tope.
   * @returns Página de organizaciones.
   */
  private async pageOfTenants(
    em: EntityManager,
    options: {
      /** Texto libre. */
      query?: string;
      /** Estado al que acotar. */
      statusConceptId?: string;
      /** Organización madre a la que acotar. */
      parentTenantId?: string;
      /** Cursor opaco. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<SearchTenantsResponseDto> {
    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterCode = typeof after?.code === 'string' ? after.code : undefined;

    const rows = await this.tenantsRepo.searchPage(
      em,
      {
        query: options.query,
        statusConceptId: options.statusConceptId,
        parentTenantId: options.parentTenantId,
        afterCode,
      },
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const last = page.at(-1);
    return {
      items: page.map((tenant) => ({
        id: tenant.id,
        code: tenant.code,
        legalName: tenant.legalName,
        tradeName: tenant.tradeName,
        tenantTypeConceptId: tenant.tenantTypeConceptId,
        statusConceptId: tenant.statusConceptId,
        verificationStatusConceptId: tenant.verificationStatusConceptId,
        parentTenantId: tenant.parentTenantId ?? null,
        createdAt: tenant.createdAt,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor:
        hasMore && last ? encodeKeysetCursor({ code: last.code }) : null,
    };
  }

  /**
   * Abre un contexto de lectura tras comprobar que la organización existe y que
   * el actor puede leerla.
   *
   * @param tenantId - Organización que se va a leer.
   * @param actor - Quien pide la lectura.
   * @returns Contexto de persistencia listo para la consulta.
   */
  private async forkForReadableTenant(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<EntityManager> {
    const em = this.em.fork();
    if (!(await this.tenantsRepo.findById(em, tenantId))) {
      throw new ResourceNotFoundException('Organización no encontrada', {
        tenantId,
      });
    }
    await this.tenantAdmin.assertCanRead(em, tenantId, actor);
    return em;
  }
}
