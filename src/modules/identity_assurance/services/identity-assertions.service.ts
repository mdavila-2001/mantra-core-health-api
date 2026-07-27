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
import { IDA } from '../identity_assurance.concepts';
import {
  IdentityAssertionsRepository,
  IdentityVerificationCasesRepository,
  IdentityFraudSignalsRepository,
} from '../repositories';
import { RevokeAssertionDto, AssertionRevokedResponseDto } from '../dto';

/**
 * UC-27-11: revocación de una aserción de identidad. Única mutación permitida en
 * la tabla inmutable (metadatos de revocación); el guard `revoked_at IS NULL`
 * evita doble revocación. Opcionalmente deriva una señal de fraude.
 */
@Injectable()
export class IdentityAssertionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly assertionsRepo: IdentityAssertionsRepository,
    private readonly casesRepo: IdentityVerificationCasesRepository,
    private readonly fraudRepo: IdentityFraudSignalsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityAssertionsService.name);
  }

  /** UC-27-11: revoca una aserción vigente y marca el caso como revocado. */
  async revoke(
    assertionId: string,
    dto: RevokeAssertionDto,
    actor: AuthenticatedUser,
  ): Promise<AssertionRevokedResponseDto> {
    this.logger.info(
      { operation: 'ida.assertion.revoke', actorId: actor.id, assertionId },
      'Revoking identity assertion',
    );
    return this.em.transactional(async (tx) => {
      const assertion = await this.assertionsRepo.findById(tx, assertionId);
      if (!assertion) {
        throw new ResourceNotFoundException(
          'Aserción de identidad no encontrada',
          { assertionId },
        );
      }
      if (assertion.revokedAt) {
        throw new ConflictException('La aserción ya está revocada', {
          assertionId,
        });
      }

      const now = new Date();
      assertion.revokedAt = now;
      assertion.revocationReasonConceptId =
        dto.revocationReasonConceptId ?? IDA.REVOCATION_FRAUD;

      const kase = await this.casesRepo.findById(
        tx,
        assertion.identityVerificationCaseId,
      );
      if (!kase) {
        throw new ResourceNotFoundException(
          'Caso de verificación no encontrado',
          {
            caseId: assertion.identityVerificationCaseId,
          },
        );
      }
      kase.statusConceptId = IDA.CASE_REVOKED;
      touch(kase, actor.id);

      if (dto.raiseFraudSignal) {
        if (!dto.fraudSignalTypeConceptId || !dto.fraudSeverityConceptId) {
          throw new PreconditionFailedException(
            'Para derivar una señal de fraude se requieren tipo y severidad',
            { assertionId },
          );
        }
        this.fraudRepo.create(tx, {
          identityVerificationCaseId: kase.id,
          signalTypeConceptId: dto.fraudSignalTypeConceptId,
          severityConceptId: dto.fraudSeverityConceptId,
          evidenceReference: `assertion:${assertion.id}`,
          resolutionConceptId: IDA.FRAUD_OPEN,
        });
      }

      await tx.flush();
      return {
        id: assertion.id,
        revokedAt: assertion.revokedAt,
        caseStatus: kase.statusConceptId,
      };
    });
  }
}
