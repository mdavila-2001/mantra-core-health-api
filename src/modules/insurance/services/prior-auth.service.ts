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
import { PriorAuthRepository, CoverageRepository } from '../repositories';
import { INS } from '../insurance.concepts';
import {
  CreatePriorAuthRequestDto,
  CreateDeterminationDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

const DECISION_CONCEPT: Record<string, string> = {
  APPROVED: INS.DECISION_APPROVED,
  DENIED: INS.DECISION_DENIED,
  PARTIAL: INS.DECISION_PARTIAL,
};

/**
 * Autorización previa: alta de solicitud con ítems (UC-26-04) y emisión de
 * determinación inmutable (UC-26-05). Cada determinación es append-only: una
 * nueva `determination_version` supersede la anterior sin mutarla, y la solicitud
 * transiciona SUBMITTED/IN_REVIEW → DETERMINED.
 */
@Injectable()
export class PriorAuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PriorAuthRepository,
    private readonly coverage: CoverageRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PriorAuthService.name);
  }

  /** UC-26-04: solicitar autorización previa con 1..N ítems. */
  async submitRequest(
    dto: CreatePriorAuthRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    this.logger.info(
      { operation: 'insurance.priorauth.submit', actorId: actor.id },
      'Submitting prior auth',
    );
    return this.em.transactional(async (tx) => {
      const coverage = await this.coverage.findCoverage(
        tx,
        dto.patientCoverageId,
      );
      if (!coverage) {
        throw new ResourceNotFoundException('Cobertura no encontrada', {
          coverageId: dto.patientCoverageId,
        });
      }

      const request = this.repo.createRequest(tx, {
        patientCoverageId: dto.patientCoverageId,
        requestingProviderTypeConceptId: INS.ELIG_PROVIDER_TYPE_PRACTICE,
        requestingProviderEntityId: dto.requestingProviderEntityId,
        statusConceptId: INS.PRIOR_AUTH_SUBMITTED,
        submittedAt: new Date(),
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();

      let sequence = 1;
      for (const item of dto.items) {
        this.repo.createItem(tx, {
          priorAuthorizationRequestId: request.id,
          itemSequence: sequence++,
          serviceConceptId: item.serviceConceptId,
          requestedQuantity: item.requestedQuantity,
          requestedAmount: item.requestedAmount,
        });
      }

      return {
        id: request.id,
        status: request.statusConceptId,
        createdAt: request.createdAt,
      };
    });
  }

  /** UC-26-05: emitir determinación y transicionar la solicitud a DETERMINED. */
  async issueDetermination(
    requestId: string,
    dto: CreateDeterminationDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    this.logger.info(
      {
        operation: 'insurance.priorauth.determine',
        requestId,
        actorId: actor.id,
      },
      'Issuing determination',
    );
    return this.em.transactional(async (tx) => {
      const request = await this.repo.findRequest(tx, requestId);
      if (!request)
        throw new ResourceNotFoundException(
          'Solicitud de autorización no encontrada',
          { requestId },
        );
      if (
        ![INS.PRIOR_AUTH_SUBMITTED, INS.PRIOR_AUTH_IN_REVIEW].includes(
          request.statusConceptId,
        )
      ) {
        throw new PreconditionFailedException(
          'La solicitud no admite determinación en su estado actual',
          {
            requestId,
          },
        );
      }

      const nextVersion =
        (await this.repo.maxDeterminationVersion(tx, requestId)) + 1;
      const determination = this.repo.createDetermination(tx, {
        priorAuthorizationRequestId: requestId,
        determinationVersion: nextVersion,
        decisionConceptId: DECISION_CONCEPT[dto.decision],
        approvedQuantity: dto.approvedQuantity,
        approvedAmount: dto.approvedAmount,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });

      request.statusConceptId = INS.PRIOR_AUTH_DETERMINED;
      touch(request, actor.id);
      await tx.flush();

      return { id: determination.id };
    });
  }
}
