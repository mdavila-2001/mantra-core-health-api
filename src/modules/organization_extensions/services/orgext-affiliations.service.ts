import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  OrganizationAffiliationsRepository,
  OrganizationDataBoundariesRepository,
} from '../repositories';
import {
  CreateAffiliationDto,
  AffiliationResponseDto,
  StatusResultDto,
} from '../dto';
import { ORGEXT } from '../organization_extensions.concepts';

/**
 * Casos de uso de afiliaciones entre organizaciones: declaración (UC-22-07, que
 * incluye la verificación de una frontera de datos del tenant participante) y
 * terminación con revocación de accesos derivados (UC-22-09).
 *
 * La revocación de grants de authz es cross-módulo (authz.clinical_access_grants
 * / resource_scope_grants): aquí se registra la intención en el log y se marca la
 * afiliación como terminada; el worker de proyección propaga la revocación.
 */
@Injectable()
export class OrgextAffiliationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly affiliationsRepo: OrganizationAffiliationsRepository,
    private readonly boundariesRepo: OrganizationDataBoundariesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrgextAffiliationsService.name);
  }

  /** UC-22-07: declara una afiliación activa entre dos tenants distintos. */
  async declare(
    dto: CreateAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    this.logger.info(
      {
        operation: 'orgext.affiliation.declare',
        primaryTenantId: dto.primaryTenantId,
        participatingTenantId: dto.participatingTenantId,
      },
      'Declaring organization affiliation',
    );
    return this.em.transactional(async (tx) => {
      if (dto.primaryTenantId === dto.participatingTenantId) {
        throw new PreconditionFailedException(
          'El tenant primario y el participante deben ser distintos',
          { tenantId: dto.primaryTenantId },
        );
      }

      // <<include>> UC-22-08: debe existir una frontera de datos para el participante.
      const boundaries = await this.boundariesRepo.countActiveForTenant(
        tx,
        dto.participatingTenantId,
        ORGEXT.BOUNDARY_ACTIVE,
      );
      if (boundaries === 0) {
        this.logger.warn(
          {
            operation: 'orgext.affiliation.declare',
            reason: 'no-data-boundary',
          },
          'Rejected affiliation: participating tenant has no active data boundary',
        );
        throw new PreconditionFailedException(
          'El tenant participante no tiene una frontera de datos activa',
          { participatingTenantId: dto.participatingTenantId },
        );
      }

      const affiliationTypeConceptId =
        dto.affiliationTypeConceptId ?? ORGEXT.AFFILIATION_TYPE_REFERRAL;
      const duplicate = await this.affiliationsRepo.findActiveDuplicate(
        tx,
        dto.primaryTenantId,
        dto.participatingTenantId,
        affiliationTypeConceptId,
        ORGEXT.AFFILIATION_ACTIVE,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una afiliación activa de ese tipo',
          {
            primaryTenantId: dto.primaryTenantId,
            participatingTenantId: dto.participatingTenantId,
          },
        );
      }

      const affiliation = this.affiliationsRepo.create(tx, {
        primaryTenantId: dto.primaryTenantId,
        participatingTenantId: dto.participatingTenantId,
        affiliationTypeConceptId,
        hostPracticeSiteId: dto.hostPracticeSiteId,
        healthcareServiceId: dto.healthcareServiceId,
        contractReference: dto.contractReference,
        dataUseAgreementId: dto.dataUseAgreementId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'orgext.affiliation.declare',
          affiliationId: affiliation.id,
        },
        'Affiliation declared',
      );
      return this.toResponse(affiliation);
    });
  }

  /** UC-22-09: termina una afiliación activa y revoca accesos derivados. */
  async terminate(
    affiliationId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'orgext.affiliation.terminate', affiliationId },
      'Terminating organization affiliation',
    );
    return this.em.transactional(async (tx) => {
      const affiliation = await this.affiliationsRepo.findById(
        tx,
        affiliationId,
      );
      if (!affiliation) {
        throw new ResourceNotFoundException('Afiliación no encontrada', {
          affiliationId,
        });
      }

      if (affiliation.statusConceptId !== ORGEXT.AFFILIATION_ACTIVE) {
        throw new PreconditionFailedException('La afiliación no está activa', {
          affiliationId,
        });
      }

      affiliation.statusConceptId = ORGEXT.AFFILIATION_TERMINATED;
      affiliation.validTo = new Date();
      touch(affiliation, actor.id);

      // Revocación de grants derivados (cross-módulo authz) — propagada por outbox.
      this.logger.info(
        {
          operation: 'orgext.affiliation.terminate',
          affiliationId,
          revokeGrants: true,
        },
        'Affiliation terminated; derived access grants revocation requested',
      );
      return { ok: true, status: affiliation.statusConceptId };
    });
  }

  private toResponse(affiliation: {
    id: string;
    primaryTenantId: string;
    participatingTenantId: string;
    statusConceptId: string;
    createdAt: Date;
  }): AffiliationResponseDto {
    return {
      id: affiliation.id,
      primaryTenantId: affiliation.primaryTenantId,
      participatingTenantId: affiliation.participatingTenantId,
      status: affiliation.statusConceptId,
      createdAt: affiliation.createdAt,
    };
  }
}
