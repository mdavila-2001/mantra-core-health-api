import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { BRANCH_TYPE_CONCEPT_BY_CODE, DIR } from '../directory.concepts';
import { BranchesRepository, TenantsRepository } from '../repositories';
import { BranchResponseDto, CreateBranchDto, UpdateBranchDto } from '../dto';
import type { Branches } from '../entities';
import { TenantAdministrationService } from './tenant-administration.service';

/** Caso de uso UC-04-04: crear una branch / sede física con geolocalización. */
@Injectable()
export class DirectoryBranchesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param branchesRepo - Valor de branches repo requerido por la operación.
   * @param tenantsRepo - Valor de tenants repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly branchesRepo: BranchesRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly tenantAdmin: TenantAdministrationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DirectoryBranchesService.name);
  }

  /** UC-04-04: da de alta una branch activa en un tenant activo (code único por tenant). */
  async create(
    tenantId: string,
    dto: CreateBranchDto,
    actor: AuthenticatedUser,
  ): Promise<BranchResponseDto> {
    this.logger.info(
      { operation: 'directory.branch.create', tenantId, actorId: actor.id },
      'Creating branch',
    );
    return this.em.transactional(async (tx) => {
      // El owner de la organización administra la suya: su poder viene de la membresía
      // OWNER, no de un rol global de plataforma.
      await this.tenantAdmin.assertCanAdminister(tx, tenantId, actor);
      const tenant = await this.tenantsRepo.findById(tx, tenantId);
      if (!tenant)
        throw new ResourceNotFoundException('Tenant no encontrado', {
          tenantId,
        });

      // PENDING también: la organización recién registrada prepara su cuenta
      // (sucursales incluidas) mientras la plataforma verifica sus papeles.
      if (
        tenant.statusConceptId !== CONCEPTS.TENANT_ACTIVE &&
        tenant.statusConceptId !== DIR.TENANT_PENDING
      ) {
        throw new PreconditionFailedException('El tenant no está activo', {
          tenantId,
        });
      }

      const clash = await this.branchesRepo.findByTenantAndCode(
        tx,
        tenantId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe una branch con ese código en el tenant',
          {
            tenantId,
            code: dto.code,
          },
        );
      }

      const branch = this.branchesRepo.create(tx, {
        tenantId,
        code: dto.code,
        name: dto.name,
        branchTypeConceptId:
          BRANCH_TYPE_CONCEPT_BY_CODE[dto.branchType ?? 'CLINIC'],
        statusConceptId: DIR.BRANCH_ACTIVE,
        timeZone: dto.timeZone,
        latitude: dto.latitude !== undefined ? String(dto.latitude) : undefined,
        longitude:
          dto.longitude !== undefined ? String(dto.longitude) : undefined,
        description: dto.description,
        locationUrl: dto.locationUrl,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'directory.branch.create', branchId: branch.id },
        'Branch created',
      );
      return toBranchResponse(branch);
    });
  }

  /** `PATCH /tenants/:id/branches/:branchId` — `null` borra, ausente deja. */
  async update(
    tenantId: string,
    branchId: string,
    dto: UpdateBranchDto,
    actor: AuthenticatedUser,
  ): Promise<BranchResponseDto> {
    return this.em.transactional(async (tx) => {
      await this.tenantAdmin.assertCanAdminister(tx, tenantId, actor);
      const branch = await this.branchesRepo.findById(tx, branchId);
      if (!branch || branch.tenantId !== tenantId) {
        throw new ResourceNotFoundException('Sucursal no encontrada', {
          tenantId,
          branchId,
        });
      }
      if (dto.name !== undefined) branch.name = dto.name;
      if (dto.description !== undefined)
        branch.description = dto.description ?? undefined;
      if (dto.locationUrl !== undefined)
        branch.locationUrl = dto.locationUrl ?? undefined;
      if (dto.latitude !== undefined)
        branch.latitude =
          dto.latitude === null ? undefined : String(dto.latitude);
      if (dto.longitude !== undefined)
        branch.longitude =
          dto.longitude === null ? undefined : String(dto.longitude);
      touch(branch, actor.id);
      await tx.flush();
      return toBranchResponse(branch);
    });
  }
}

/** La sucursal con la forma del listado y la del alta a la vez. */
export function toBranchResponse(branch: Branches): BranchResponseDto {
  return {
    id: branch.id,
    tenantId: branch.tenantId,
    code: branch.code,
    name: branch.name,
    status: branch.statusConceptId,
    statusConceptId: branch.statusConceptId,
    branchTypeConceptId: branch.branchTypeConceptId,
    timeZone: branch.timeZone ?? undefined,
    description: branch.description ?? undefined,
    locationUrl: branch.locationUrl ?? undefined,
    latitude: branch.latitude == null ? undefined : Number(branch.latitude),
    longitude: branch.longitude == null ? undefined : Number(branch.longitude),
    createdAt: branch.createdAt,
  };
}
