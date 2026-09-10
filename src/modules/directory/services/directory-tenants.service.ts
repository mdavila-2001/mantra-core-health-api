import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { TenantTypeProfileService } from './tenant-type-profile.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DIR,
  TENANT_TYPE_CONCEPT_BY_CODE,
  type TenantTypeCode,
} from '../directory.concepts';
import {
  BranchesRepository,
  TenantMembershipsRepository,
  TenantsRepository,
} from '../repositories';
import { CatalogRepository } from '../../insurance/repositories';
import type { Tenants } from '../entities';
import {
  CreateChildTenantDto,
  CreateTenantDto,
  StatusResultDto,
  SuspendTenantDto,
  TenantResponseDto,
  UpdateTenantDto,
  VerifyTenantDto,
  UpdateTenantPublicProfileDto,
} from '../dto';
import { TenantAdministrationService } from './tenant-administration.service';
import { PublicProfileProjectionService } from '../../community/services';
import { COMM } from '../../community/community.concepts';

/**
 * Resuelve el tipo de organización a su concept id.
 *
 * El código (`tenantType`) manda sobre el UUID crudo (`tenantTypeConceptId`),
 * que queda como escotilla para tipos que un despliegue haya sembrado por su
 * cuenta fuera del catálogo interno. Sin ninguno de los dos, el `fallback`.
 *
 * @param code - Código de tipo de organización, si el cliente lo declaró.
 * @param conceptId - Concept id crudo, si el cliente lo declaró.
 * @param fallback - Concepto a usar cuando el cliente no declara ninguno.
 * @returns El `tenant_type_concept_id` a persistir.
 */
function resolveTenantType(
  code: TenantTypeCode | undefined,
  conceptId: string | undefined,
  fallback: string,
): string {
  if (code) return TENANT_TYPE_CONCEPT_BY_CODE[code];
  return conceptId ?? fallback;
}

/**
 * Casos de uso de tenants: aprovisionamiento raíz (UC-04-01), verificación /
 * activación (UC-04-02), creación de sub-tenant (UC-04-03) y suspensión en
 * cascada (UC-04-10).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * tenant padre antes de crear su membresía owner (las FK son columnas uuid, así
 * que MikroORM no ordena inserts entre entidades no relacionadas).
 */
@Injectable()
export class DirectoryTenantsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantsRepo - Valor de tenants repo requerido por la operación.
   * @param membershipsRepo - Valor de memberships repo requerido por la operación.
   * @param branchesRepo - Valor de branches repo requerido por la operación.
   * @param catalogRepo - Acceso a `insurance.insurance_carriers`, para editar el bloque `payer`.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tenantsRepo: TenantsRepository,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly branchesRepo: BranchesRepository,
    private readonly typeProfile: TenantTypeProfileService,
    // Quién puede administrar una organización lo decide un solo lugar, el
    // mismo que ya usan las lecturas: duplicar el criterio acá sería tener dos
    // definiciones de «admin de la organización» que se separan con el tiempo.
    private readonly tenantAdmin: TenantAdministrationService,
    // La vitrina pública de la organización, que se crea al verificarla.
    private readonly publicProfiles: PublicProfileProjectionService,
    private readonly catalogRepo: CatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DirectoryTenantsService.name);
  }

  /** UC-04-01: aprovisiona un tenant raíz (pending/unverified) con su membership owner. */
  async provision(
    dto: CreateTenantDto,
    actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    this.logger.info(
      { operation: 'directory.tenant.provision', actorId: actor.id },
      'Provisioning tenant',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.tenantsRepo.findByCode(tx, dto.code);
      if (clash) {
        this.logger.warn(
          { operation: 'directory.tenant.provision', reason: 'code-in-use' },
          'Rejected tenant provision: code already exists',
        );
        throw new ConflictException('El código de tenant ya existe', {
          code: dto.code,
        });
      }

      // El tipo y sus datos se validan antes de escribir: un tenant tipado sin
      // lo que su tipo exige es un alta a medias que alguien tendría que reparar.
      // Los conceptos también: son FK, y descubrirlas en el INSERT da un 500.
      this.typeProfile.assertProfileMatchesType(dto);
      await this.typeProfile.assertConceptsExist(tx, {
        ...this.typeProfile.declaredConcepts(dto),
        tenantTypeConceptId: dto.tenantTypeConceptId,
        legalEntityTypeConceptId: dto.legalEntityTypeConceptId,
        dataResidencyRegionConceptId: dto.dataResidencyRegionConceptId,
      });

      const tenant = this.tenantsRepo.create(tx, {
        code: dto.code,
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        countryConceptId: dto.countryConceptId,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        tenantTypeConceptId: resolveTenantType(
          dto.tenantType,
          dto.tenantTypeConceptId,
          CONCEPTS.TENANT_TYPE_PROVIDER,
        ),
        legalEntityTypeConceptId:
          dto.legalEntityTypeConceptId ?? CONCEPTS.LEGAL_ENTITY_COMPANY,
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        dataResidencyRegionConceptId: dto.dataResidencyRegionConceptId,
        timeZone: dto.timeZone,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el tenant antes de la membership hija.
      await tx.flush();

      // La fila propia del tipo (aseguradora, corredor o unidad diagnóstica)
      // va en esta misma transacción: un PAYER sin su carrier es un tipo que
      // no se sostiene. El administrador de la práctica que provisiona un
      // DIAGNOSTIC_CENTER es el owner declarado, no `actor` (quien lo
      // aprovisiona por la puerta administrativa).
      await this.typeProfile.materializeProfile(
        tx,
        tenant.id,
        dto,
        actor.id,
        dto.ownerUserId,
      );

      this.membershipsRepo.create(tx, {
        userId: dto.ownerUserId,
        tenantId: tenant.id,
        tenantRoleConceptId: DIR.ROLE_OWNER,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        invitedByUserId: actor.id,
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'directory.tenant.provision', tenantId: tenant.id },
        'Tenant provisioned',
      );
      return this.toResponse(tenant);
    });
  }

  /**
   * Llena la vitrina pública de una organización verificada.
   *
   * ## Por qué hace falta un endpoint, y por qué vive acá
   *
   * `verify()` proyecta la vitrina con el nombre y el slug —es todo lo que la
   * verificación sabe— y hasta acá **no había ninguna forma de completarla**.
   * La vitrina de un profesional se edita por `PUT /community/profiles/me`,
   * que resuelve el sujeto desde la sesión; el sujeto de una organización es su
   * tenant, y ninguna sesión «es» un tenant. Por eso el directorio de centros
   * de salud se veía vacío: no era la pantalla, era que no había nada cargado
   * ni manera de cargarlo.
   *
   * Va en `/admin/tenants/:id/public-profile`, al lado del alta y de la
   * verificación, porque es el mismo trámite —lo que la plataforma administra
   * de una organización— y no una acción del grafo social.
   *
   * @param tenantId - La organización cuya vitrina se llena.
   * @param dto - Campos a cambiar; los omitidos se conservan.
   * @param actor - Quién lo hace, para la auditoría.
   * @returns La organización, tal como la devuelven el alta y la verificación.
   */
  async updatePublicProfile(
    tenantId: string,
    dto: UpdateTenantPublicProfileDto,
    actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    this.logger.info(
      {
        operation: 'directory.tenant.updatePublicProfile',
        tenantId,
        actorId: actor.id,
      },
      'Updating tenant public profile',
    );
    return this.em.transactional(async (tx) => {
      const tenant = await this.tenantsRepo.findById(tx, tenantId);
      if (!tenant)
        throw new ResourceNotFoundException('Tenant no encontrado', {
          tenantId,
        });

      // El sujeto de la vitrina de una organización es su propio tenant: es lo
      // que escribe `verify()` (`targetId: tenant.id`) y lo que lee la ficha
      // pública. Si eso cambiara, cambia en los dos lados o en ninguno.
      await this.publicProfiles.updateOrganizationVitrina(tx, {
        targetId: tenant.id,
        displayName: dto.displayName,
        headline: dto.headline,
        biography: dto.biography,
        avatarFileId: dto.avatarFileId,
        coverFileId: dto.coverFileId,
        actorUserId: actor.id,
      });

      return this.toResponse(tenant);
    });
  }

  /** UC-04-02: verifica y activa un tenant (pending -> active, unverified -> verified). */
  async verify(
    tenantId: string,
    dto: VerifyTenantDto,
    actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    this.logger.info(
      { operation: 'directory.tenant.verify', tenantId, actorId: actor.id },
      'Verifying tenant',
    );
    return this.em.transactional(async (tx) => {
      const tenant = await this.tenantsRepo.findById(tx, tenantId);
      if (!tenant)
        throw new ResourceNotFoundException('Tenant no encontrado', {
          tenantId,
        });

      if (tenant.statusConceptId !== DIR.TENANT_PENDING) {
        throw new PreconditionFailedException(
          'El tenant no está pendiente de verificación',
          {
            tenantId,
          },
        );
      }

      tenant.verificationStatusConceptId = CONCEPTS.TENANT_VERIFIED;
      tenant.statusConceptId = CONCEPTS.TENANT_ACTIVE;
      if (dto.countryConceptId) tenant.countryConceptId = dto.countryConceptId;
      if (dto.jurisdictionConceptId)
        tenant.jurisdictionConceptId = dto.jurisdictionConceptId;
      touch(tenant, actor.id);

      // TP-1: verificar es lo que la hace pública, y es el mismo patrón que ya
      // usa `verify-and-publish` de las unidades de diagnóstico.
      //
      // Antes de esto, una organización jamás llegaba al directorio público:
      // nadie proyectaba su vitrina, así que `GET /public/search/organizations`
      // cumplía «la no verificada es invisible» por la peor de las razones —lo
      // eran todas—. Colgarlo de la verificación deja las dos mitades del
      // criterio ciertas a la vez: sin aprobar no aparece, aprobada aparece.
      //
      // El slug lleva el identificador y no el nombre a propósito: dos clínicas
      // pueden llamarse igual y el slug es único; el nombre bonito es el
      // `displayName`, que sí se puede repetir.
      await this.publicProfiles.projectOrganization(tx, {
        tenantId: tenant.id,
        targetId: tenant.id,
        slug: `organization-${tenant.id}`,
        displayName: tenant.tradeName ?? tenant.legalName,
        actorUserId: actor.id,
        // Una farmacia verificada tiene que aparecer en la vertical de
        // farmacias, no en la de organizaciones. Proyectarlas todas como
        // organización dejaba `/public/search/pharmacies` en cero para siempre,
        // y el buscador público con una vertical muerta.
        targetTypeConceptId: vitrinaSegunTipo(tenant.tenantTypeConceptId),
      });

      this.logger.info(
        { operation: 'directory.tenant.verify', tenantId },
        'Tenant verified and activated',
      );
      return this.toResponse(tenant);
    });
  }

  /**
   * TP-1: la organización corrige sus propios datos.
   *
   * ## Qué faltaba
   *
   * Una organización se aprovisionaba y después no había forma de tocarla: ni
   * corregir la razón social mal tipeada, ni poner el nombre comercial con el
   * que la conocen los pacientes, ni declarar su zona horaria —que no es
   * cosmética, porque es la zona en la que se leen los horarios de sus
   * agendas—. La única salida era escribir en la base.
   *
   * ## Quién puede
   *
   * `assertCanAdminister`: owner o admin **de esa** organización, o la
   * plataforma. Un `staff` la ve y no la edita, que es la distinción que el
   * prompt pide y que el modelo ya sabía hacer.
   *
   * ## Qué no se edita acá
   *
   * El estado y la verificación. Los mueve la plataforma por su propio
   * endpoint; dejarlos acá haría de la verificación una declaración jurada de
   * uno mismo. Y el logo tampoco: `directory.tenants` no tiene columna de
   * archivo y la imagen de una organización ya vive en su perfil público, que
   * es además la que se ve en el directorio. Inventar una segunda daría dos
   * logos que se contradicen.
   *
   * `PATCH`: lo que no viene no se toca.
   *
   * @param tenantId - Organización a editar.
   * @param dto - Los campos a cambiar.
   * @param actor - Quien edita.
   * @returns La ficha ya actualizada.
   */
  async updateTenant(
    tenantId: string,
    dto: UpdateTenantDto,
    actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    this.logger.info(
      { operation: 'directory.tenant.update', tenantId, actorId: actor.id },
      'Updating tenant profile',
    );
    return this.em.transactional(async (tx) => {
      const tenant = await this.tenantsRepo.findById(tx, tenantId);
      // 404 antes que 403, igual que la lectura: lo contrario permitiría
      // sondear qué identificadores existen midiendo el código de error.
      if (!tenant) {
        throw new ResourceNotFoundException('Organización no encontrada', {
          tenantId,
        });
      }
      await this.tenantAdmin.assertCanAdminister(tx, tenantId, actor);

      if (dto.legalName !== undefined) tenant.legalName = dto.legalName;
      if (dto.tradeName !== undefined) tenant.tradeName = dto.tradeName;
      if (dto.timeZone !== undefined) tenant.timeZone = dto.timeZone;
      if (dto.currencyConceptId !== undefined) {
        tenant.currencyConceptId = dto.currencyConceptId;
      }
      touch(tenant, actor.id);

      // El bloque `payer` sólo tiene dónde aterrizar si el tenant es una
      // aseguradora; si no hay carrier, se ignora en vez de romper el resto
      // de la actualización.
      if (dto.payer) {
        const carrier = await this.catalogRepo.findCarrierByTenantId(
          tx,
          tenantId,
        );
        if (carrier) {
          if (dto.payer.sigla !== undefined) carrier.sigla = dto.payer.sigla;
          if (dto.payer.address !== undefined) {
            carrier.address = dto.payer.address;
          }
          if (dto.payer.regulatorIdentifier !== undefined) {
            carrier.regulatorIdentifier = dto.payer.regulatorIdentifier;
          }
          touch(carrier, actor.id);
        }
      }

      return this.toResponse(tenant);
    });
  }

  /** UC-04-03: crea un sub-tenant hijo (active) con su membership administrativo inicial. */
  async createChild(
    parentTenantId: string,
    dto: CreateChildTenantDto,
    actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    this.logger.info(
      {
        operation: 'directory.tenant.child',
        parentTenantId,
        actorId: actor.id,
      },
      'Creating child tenant',
    );
    return this.em.transactional(async (tx) => {
      const parent = await this.tenantsRepo.findById(tx, parentTenantId);
      if (!parent)
        throw new ResourceNotFoundException('Tenant padre no encontrado', {
          parentTenantId,
        });

      if (parent.statusConceptId !== CONCEPTS.TENANT_ACTIVE) {
        throw new PreconditionFailedException(
          'El tenant padre no está activo',
          { parentTenantId },
        );
      }

      const clash = await this.tenantsRepo.findByCode(tx, dto.code);
      if (clash)
        throw new ConflictException('El código de tenant ya existe', {
          code: dto.code,
        });

      this.typeProfile.assertProfileMatchesType(dto);
      await this.typeProfile.assertConceptsExist(tx, {
        ...this.typeProfile.declaredConcepts(dto),
        tenantTypeConceptId: dto.tenantTypeConceptId,
        legalEntityTypeConceptId: dto.legalEntityTypeConceptId,
      });

      const child = this.tenantsRepo.create(tx, {
        code: dto.code,
        legalName: dto.legalName,
        countryConceptId: dto.countryConceptId,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        tenantTypeConceptId: resolveTenantType(
          dto.tenantType,
          dto.tenantTypeConceptId,
          parent.tenantTypeConceptId,
        ),
        legalEntityTypeConceptId:
          dto.legalEntityTypeConceptId ?? parent.legalEntityTypeConceptId,
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        dataResidencyRegionConceptId:
          dto.dataResidencyRegionConceptId ??
          parent.dataResidencyRegionConceptId,
        parentTenantId: parent.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.typeProfile.materializeProfile(
        tx,
        child.id,
        dto,
        actor.id,
        dto.adminUserId,
      );

      this.membershipsRepo.create(tx, {
        userId: dto.adminUserId,
        tenantId: child.id,
        tenantRoleConceptId: DIR.ROLE_ADMIN,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        invitedByUserId: actor.id,
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'directory.tenant.child', tenantId: child.id },
        'Child tenant created',
      );
      return this.toResponse(child);
    });
  }

  /** UC-04-10: suspende un tenant activo y cascadea a sus branches y memberships activos. */
  async suspend(
    tenantId: string,
    dto: SuspendTenantDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'directory.tenant.suspend', tenantId, actorId: actor.id },
      'Suspending tenant',
    );
    return this.em.transactional(async (tx) => {
      const tenant = await this.tenantsRepo.findById(tx, tenantId);
      if (!tenant)
        throw new ResourceNotFoundException('Tenant no encontrado', {
          tenantId,
        });

      if (tenant.statusConceptId !== CONCEPTS.TENANT_ACTIVE) {
        throw new PreconditionFailedException('El tenant no está activo', {
          tenantId,
        });
      }

      tenant.statusConceptId = DIR.TENANT_SUSPENDED;
      touch(tenant, actor.id);

      const branches = await this.branchesRepo.findByTenantAndStatus(
        tx,
        tenantId,
        DIR.BRANCH_ACTIVE,
      );
      for (const branch of branches) {
        branch.statusConceptId = DIR.BRANCH_SUSPENDED;
        touch(branch, actor.id);
      }

      const memberships = await this.membershipsRepo.findByTenantAndStatus(
        tx,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
      );
      for (const membership of memberships) {
        membership.statusConceptId = DIR.MEMBERSHIP_SUSPENDED;
        touch(membership, actor.id);
      }

      this.logger.info(
        {
          operation: 'directory.tenant.suspend',
          tenantId,
          reason: dto.reason,
          branches: branches.length,
          memberships: memberships.length,
        },
        'Tenant suspended with cascade',
      );
      return { ok: true };
    });
  }

  /** Proyecta la entidad tenant al DTO de respuesta público. */
  private toResponse(tenant: Tenants): TenantResponseDto {
    return {
      id: tenant.id,
      code: tenant.code,
      legalName: tenant.legalName,
      status: tenant.statusConceptId,
      verificationStatus: tenant.verificationStatusConceptId,
      parentTenantId: tenant.parentTenantId,
      createdAt: tenant.createdAt,
    };
  }
}

/**
 * Qué clase de vitrina pública le corresponde a un tenant según su tipo.
 *
 * Sólo se mapea lo **inequívoco**: una farmacia es una farmacia y una pagadora
 * es una aseguradora. El resto —hospital, consultorio, universidad, negocio de
 * salud— cae en organización, que es lo que eran todas hasta ahora.
 *
 * Los laboratorios **no** están acá a propósito: no son un tipo de tenant, son
 * el agregado de `diagnostic_units`, que ya proyecta su propia vitrina en su
 * `verify-and-publish`. Mapear `HEALTH_OTHER` a laboratorio metería en esa
 * vertical a cualquier negocio de salud que no sea ninguna de las otras cosas.
 */
function vitrinaSegunTipo(tenantTypeConceptId: string | undefined): string {
  if (tenantTypeConceptId === CONCEPTS.TENANT_TYPE_PHARMACY) {
    return COMM.PROFILE_TARGET_PHARMACY;
  }
  if (tenantTypeConceptId === CONCEPTS.TENANT_TYPE_PAYER) {
    return COMM.PROFILE_TARGET_INSURER;
  }
  return COMM.PROFILE_TARGET_ORGANIZATION;
}
