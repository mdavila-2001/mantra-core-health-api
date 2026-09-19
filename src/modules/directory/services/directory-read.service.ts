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
  DirectoryTenantLegalRepository,
} from '../repositories';
import { TenantAdministrationService } from './tenant-administration.service';
import {
  AddressesRepository,
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import { CatalogRepository } from '../../insurance/repositories';
import { DIR, TENANT_TYPE_CONCEPT_BY_CODE } from '../directory.concepts';
import {
  EXECUTIVE_DTO_KEYS,
  EXECUTIVE_ROLE_BY_DTO_KEY,
  REPRESENTATIVE_ROLE_BY_CODE,
  type RepresentativeRole,
} from '../legal-representatives';
import { AffiliationDocumentConceptsService } from './affiliation-document-concepts.service';

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
   * @param addressesRepo - Acceso a `common.addresses`, para la casa matriz del `payer` (subtarea 1.3).
   * @param legalRepo - Acceso a los vínculos de representación (subtarea 1.4).
   * @param identifiersRepo - Acceso a `common.identifiers`, para el documento del representante.
   * @param contactPointsRepo - Acceso a `common.contact_points`, para correos y teléfonos.
   * @param concepts - Resuelve los conceptos de rol para traducirlos a su código canónico.
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
    private readonly addressesRepo: AddressesRepository,
    private readonly legalRepo: DirectoryTenantLegalRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly concepts: AffiliationDocumentConceptsService,
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
          // La casa matriz georreferenciada (subtarea 1.3) vive en
          // `common.addresses`, no en el carrier: `owner_id` es el tenant y
          // `findVigenteByOwnerAndUse` no distingue por `owner_type`, pero
          // un uuid de tenant no colisiona con uno de persona o de usuario.
          const casaMatriz = await this.addressesRepo.findVigenteByOwnerAndUse(
            em,
            tenant.id,
            CONCEPTS.ADDR_USE_WORK,
          );
          payer = {
            carrierCode: carrier.carrierCode,
            regulatorIdentifier: carrier.regulatorIdentifier ?? '',
            sigla: carrier.sigla ?? '',
            address: carrier.address ?? '',
            ...(casaMatriz?.latitude !== undefined &&
            casaMatriz?.latitude !== null &&
            casaMatriz?.longitude !== undefined &&
            casaMatriz?.longitude !== null
              ? {
                  latitude: Number(casaMatriz.latitude),
                  longitude: Number(casaMatriz.longitude),
                }
              : {}),
          };
        }
      }

      const representacion = await this.leerRepresentacion(em, tenant.id);

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
        ...representacion,
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

  /**
   * Quién representa a la organización y quiénes son sus gerencias de
   * contacto (subtarea 1.4).
   *
   * Tres consultas por organización con fila de representación —personas,
   * documentos y contactos— en vez de una por persona: la ficha nombra hasta
   * cuatro, y el bucle de arriba ya recorre una membresía por vuelta.
   *
   * El orden **no** lo decide Postgres: `listLegalRepsByTenant` no ordena, así
   * que el representante se identifica por su rol y las gerencias se devuelven
   * en el orden canónico de `EXECUTIVE_DTO_KEYS`. Una fila con un rol que el
   * diccionario no conoce —un `apoderado` cargado a mano, por ejemplo— se
   * omite en vez de romper la ficha.
   *
   * @param em - Contexto de persistencia de esta lectura.
   * @param tenantId - La organización.
   * @returns Las claves a mezclar en la ficha; vacío si no hay vínculos.
   */
  private async leerRepresentacion(
    em: EntityManager,
    tenantId: string,
  ): Promise<
    Pick<MyOrganizationDto, 'legalRepresentative' | 'executives'> | object
  > {
    const vinculos = await this.legalRepo.listLegalRepsByTenant(em, tenantId);
    if (vinculos.length === 0) return {};

    const concepts = await this.concepts.resolve(em);
    // Concepto → código del catálogo → rol canónico. El mapa viene al revés
    // (código → concepto), así que se invierte una vez por lectura.
    const rolPorConcepto = new Map<string, RepresentativeRole>();
    for (const [code, conceptId] of concepts.representativeRole) {
      const rol = REPRESENTATIVE_ROLE_BY_CODE[code];
      if (rol) rolPorConcepto.set(conceptId, rol);
    }

    const personIds = vinculos.map((v) => v.personId);
    const ciIds = vinculos
      .map((v) => v.ciIdentifierId)
      .filter((id): id is string => Boolean(id));

    const personas = await this.legalRepo.findPersonsByIds(em, personIds);
    const documentos = await this.identifiersRepo.findByIds(em, ciIds);
    const contactos = await this.contactPointsRepo.findVigentesByOwners(
      em,
      personIds,
    );

    // `findVigentesByOwners` ya viene ordenado por preferencia: el primero de
    // cada sistema es el que la organización quiere que se use.
    const contactoDe = (personId: string, systemConceptIds: string[]) =>
      contactos.find(
        (c) =>
          c.ownerId === personId &&
          systemConceptIds.includes(c.systemConceptId),
      )?.value;

    const fichaDe = (
      vinculo: (typeof vinculos)[number],
      rol: RepresentativeRole,
    ) => {
      const persona = personas.get(vinculo.personId);
      if (!persona) return undefined;
      return {
        role: rol,
        fullName: persona.displayName ?? '',
        // Las partes sólo se declaran si `persons` las tiene: un contacto
        // registrado con la forma legada (`fullName`), o antes de esta
        // subtarea, sólo tiene `display_name` — no hay de dónde sacarlas.
        // MikroORM hidrata una columna nullable sin valor como `null`, nunca
        // `undefined` — comparar contra `undefined` acá dejaba pasar un
        // `name: null` explícito al JSON de respuesta.
        ...(persona.name == null ? {} : { name: persona.name }),
        ...(persona.middleName == null ? {} : { middleName: persona.middleName }),
        ...(persona.lastName == null ? {} : { lastName: persona.lastName }),
        ...(persona.motherLastName == null
          ? {}
          : { motherLastName: persona.motherLastName }),
        email: contactoDe(vinculo.personId, [CONCEPTS.CONTACT_EMAIL]),
        phone: contactoDe(vinculo.personId, [
          CONCEPTS.CONTACT_MOBILE,
          CONCEPTS.CONTACT_PHONE,
        ]),
        idNumber: vinculo.ciIdentifierId
          ? documentos.get(vinculo.ciIdentifierId)?.value
          : undefined,
      };
    };

    const porRol = new Map<RepresentativeRole, (typeof vinculos)[number]>();
    for (const vinculo of vinculos) {
      const rol = rolPorConcepto.get(vinculo.representativeRoleConceptId);
      if (!rol) continue;
      // Ante dos filas del mismo rol —datos viejos, o una corrección a mano—
      // gana la marcada como principal; si ninguna lo está, la primera.
      const previo = porRol.get(rol);
      if (previo && !(vinculo.isPrimary === true)) continue;
      porRol.set(rol, vinculo);
    }

    const representante = porRol.get('LEGAL_REPRESENTATIVE');
    const legalRepresentative = representante
      ? fichaDe(representante, 'LEGAL_REPRESENTATIVE')
      : undefined;

    const executives = EXECUTIVE_DTO_KEYS.map((key) => {
      const rol = EXECUTIVE_ROLE_BY_DTO_KEY[key];
      const vinculo = porRol.get(rol);
      return vinculo ? fichaDe(vinculo, rol) : undefined;
    }).filter((ficha): ficha is NonNullable<typeof ficha> => Boolean(ficha));

    return {
      ...(legalRepresentative ? { legalRepresentative } : {}),
      ...(executives.length > 0 ? { executives } : {}),
    };
  }
}
