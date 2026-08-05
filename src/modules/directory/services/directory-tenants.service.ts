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
import type { Tenants } from '../entities';
import {
  CreateChildTenantDto,
  CreateTenantDto,
  StatusResultDto,
  SuspendTenantDto,
  TenantResponseDto,
  VerifyTenantDto,
} from '../dto';

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
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tenantsRepo: TenantsRepository,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly branchesRepo: BranchesRepository,
    private readonly typeProfile: TenantTypeProfileService,
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

      // La fila propia del tipo (aseguradora o corredor) va en esta misma
      // transacción: un PAYER sin su carrier es un tipo que no se sostiene.
      this.typeProfile.materializeProfile(tx, tenant.id, dto, actor.id);

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

      this.logger.info(
        { operation: 'directory.tenant.verify', tenantId },
        'Tenant verified and activated',
      );
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

      this.typeProfile.materializeProfile(tx, child.id, dto, actor.id);

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
