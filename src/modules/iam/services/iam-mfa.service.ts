import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  UsersRepository,
  MfaFactorsRepository,
  SecurityEventsRepository,
} from '../repositories';
import { MfaFactorDto, MfaFactorResponseDto } from '../dto';

/**
 * Enrolamiento y verificación de factores MFA (UC-01-03). El mismo endpoint sirve
 * para dar de alta un factor (PENDING) o para verificar uno existente, lo que
 * además habilita el MFA a nivel de usuario.
 */
@Injectable()
export class IamMfaService {
  constructor(
    private readonly em: EntityManager,
    private readonly usersRepo: UsersRepository,
    private readonly mfaRepo: MfaFactorsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamMfaService.name);
  }

  /** UC-01-03: enrola un factor nuevo o verifica uno existente. */
  async enrollOrVerify(
    userId: string,
    dto: MfaFactorDto,
    actor: AuthenticatedUser,
  ): Promise<MfaFactorResponseDto> {
    return this.em.transactional(async (tx) => {
      const user = await this.usersRepo.findById(tx, userId);
      if (!user) throw new ResourceNotFoundException('Usuario no encontrado', { userId });

      if (dto.verify) {
        this.logger.info({ operation: 'iam.mfa.verify', userId, factorId: dto.factorId }, 'Verifying MFA factor');
        if (!dto.factorId) {
          throw new PreconditionFailedException('factorId es obligatorio para verificar');
        }
        const factor = await this.mfaRepo.findByIdAndUser(tx, dto.factorId, userId);
        if (!factor) {
          throw new ResourceNotFoundException('Factor MFA no encontrado', {
            userId,
            factorId: dto.factorId,
          });
        }

        factor.stateConceptId = CONCEPTS.STATE_VERIFIED;
        factor.verifiedAt = new Date();
        touch(factor, actor.id);

        user.mfaStatusConceptId = CONCEPTS.MFA_ENABLED;
        touch(user, actor.id);

        this.eventsRepo.record(tx, {
          eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId,
          recordedByUserId: actor.id,
          detailJson: { factorId: factor.id, action: 'verify' },
        });

        return {
          id: factor.id,
          userId,
          state: factor.stateConceptId,
          verifiedAt: factor.verifiedAt,
        };
      }

      this.logger.info({ operation: 'iam.mfa.enroll', userId, factorType: dto.factorType }, 'Enrolling MFA factor');
      if (!dto.factorType) {
        throw new PreconditionFailedException('factorType es obligatorio para enrolar');
      }
      const factorTypeConceptId =
        dto.factorType === 'TOTP' ? CONCEPTS.MFA_TOTP : CONCEPTS.MFA_WEBAUTHN;

      const factor = this.mfaRepo.create(tx, {
        userId,
        factorTypeConceptId,
        label: dto.label,
        actorUserId: actor.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId,
        recordedByUserId: actor.id,
        detailJson: { action: 'enroll', factorType: dto.factorType },
      });

      return { id: factor.id, userId, state: factor.stateConceptId, verifiedAt: undefined };
    });
  }
}
