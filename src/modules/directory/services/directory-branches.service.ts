import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { BRANCH_TYPE_CONCEPT_BY_CODE, DIR } from '../directory.concepts';
import { BranchesRepository, TenantsRepository } from '../repositories';
import { BranchResponseDto, CreateBranchDto } from '../dto';

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
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'directory.branch.create', branchId: branch.id },
        'Branch created',
      );
      return {
        id: branch.id,
        tenantId: branch.tenantId,
        code: branch.code,
        name: branch.name,
        status: branch.statusConceptId,
        createdAt: branch.createdAt,
      };
    });
  }
}
