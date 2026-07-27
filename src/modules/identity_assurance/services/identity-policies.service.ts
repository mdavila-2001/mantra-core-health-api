import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { IdentityVerificationPoliciesRepository } from '../repositories';
import { CreatePolicyDto, PolicyResponseDto } from '../dto';

/**
 * Soporte de UC-27-02: alta de políticas de verificación de identidad (IAL/AAL).
 * Una política vigente es precondición para abrir un caso.
 */
@Injectable()
export class IdentityPoliciesService {
  constructor(
    private readonly em: EntityManager,
    private readonly policiesRepo: IdentityVerificationPoliciesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityPoliciesService.name);
  }

  /** Crea una política vigente (effective_from = ahora, sin fin) en estado activo. */
  async createPolicy(
    dto: CreatePolicyDto,
    actor: AuthenticatedUser,
  ): Promise<PolicyResponseDto> {
    this.logger.info(
      {
        operation: 'ida.policy.create',
        actorId: actor.id,
        code: dto.policyCode,
      },
      'Creating identity verification policy',
    );
    return this.em.transactional(async (tx) => {
      const policy = this.policiesRepo.create(tx, {
        policyCode: dto.policyCode,
        subjectTypeConceptId: dto.subjectTypeConceptId,
        transactionRiskConceptId: dto.transactionRiskConceptId,
        requiredIdentityAssuranceLevelConceptId:
          dto.requiredIdentityAssuranceLevelConceptId,
        requiredAuthenticatorAssuranceLevelConceptId:
          dto.requiredAuthenticatorAssuranceLevelConceptId,
        requiredFederationAssuranceLevelConceptId:
          dto.requiredFederationAssuranceLevelConceptId,
        evidenceRequirementsJson: dto.evidenceRequirementsJson,
        fraudControlsJson: dto.fraudControlsJson,
        versionNumber: dto.versionNumber ?? 1,
        effectiveFrom: new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: policy.id,
        policyCode: policy.policyCode,
        status: policy.statusConceptId,
        createdAt: policy.createdAt,
      };
    });
  }
}
