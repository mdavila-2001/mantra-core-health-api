import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { OrganizationDataBoundariesRepository } from '../repositories';
import { CreateDataBoundaryDto, DataBoundaryResponseDto } from '../dto';
import { ORGEXT } from '../organization_extensions.concepts';

/**
 * Caso de uso de frontera de datos (residencia/RLS): definición (UC-22-08). El
 * servicio posee la transacción y aplica el guard de unicidad de frontera vigente
 * por (tenant, tipo) en la misma unidad de trabajo. Afecta la re-evaluación de
 * políticas de acceso, propagada por el worker de proyección.
 */
@Injectable()
export class OrgextDataBoundariesService {
  constructor(
    private readonly em: EntityManager,
    private readonly boundariesRepo: OrganizationDataBoundariesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrgextDataBoundariesService.name);
  }

  /** UC-22-08: define una frontera de datos activa para un tenant. */
  async define(
    dto: CreateDataBoundaryDto,
    actor: AuthenticatedUser,
  ): Promise<DataBoundaryResponseDto> {
    this.logger.info(
      { operation: 'orgext.data-boundary.define', tenantId: dto.tenantId },
      'Defining organization data boundary',
    );
    return this.em.transactional(async (tx) => {
      const boundaryTypeConceptId =
        dto.boundaryTypeConceptId ?? ORGEXT.BOUNDARY_TYPE_RESIDENCY;
      const existing = await this.boundariesRepo.findActiveByTenantAndType(
        tx,
        dto.tenantId,
        boundaryTypeConceptId,
        ORGEXT.BOUNDARY_ACTIVE,
      );
      if (existing) {
        this.logger.warn(
          {
            operation: 'orgext.data-boundary.define',
            reason: 'active-boundary-exists',
          },
          'Rejected data boundary: an active boundary of this type already exists',
        );
        throw new ConflictException(
          'Ya existe una frontera de datos activa de ese tipo para el tenant',
          { tenantId: dto.tenantId },
        );
      }

      const boundary = this.boundariesRepo.create(tx, {
        tenantId: dto.tenantId,
        boundaryTypeConceptId,
        dataControllerTenantId: dto.dataControllerTenantId,
        dataProcessorTenantId: dto.dataProcessorTenantId,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        residencyRegionConceptId: dto.residencyRegionConceptId,
        allowedPurposeValueSetId: dto.allowedPurposeValueSetId,
        isolationSchemaName: dto.isolationSchemaName,
        isolationPolicyVersion: dto.isolationPolicyVersion,
        statusConceptId: ORGEXT.BOUNDARY_ACTIVE,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'orgext.data-boundary.define', boundaryId: boundary.id },
        'Data boundary defined',
      );
      return {
        id: boundary.id,
        tenantId: boundary.tenantId,
        status: boundary.statusConceptId,
        effectiveFrom: boundary.effectiveFrom,
        createdAt: boundary.createdAt,
      };
    });
  }
}
