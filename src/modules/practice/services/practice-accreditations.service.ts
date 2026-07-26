import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../practice.concepts';
import { PracticesRepository, PracticeSitesRepository, PracticeAccreditationsRepository } from '../repositories';
import {
  CreateAccreditationDto,
  VerifyAccreditationDto,
  AccreditationResponseDto,
} from '../dto';

/**
 * Casos de uso de acreditación: registro con evidencia (UC-14-02) y
 * verificación/caducidad como transición de estado (UC-14-03).
 */
@Injectable()
export class PracticeAccreditationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly accreditationsRepo: PracticeAccreditationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeAccreditationsService.name);
  }

  /** UC-14-02: registra una acreditación en estado PENDING. */
  async create(
    practiceId: string,
    dto: CreateAccreditationDto,
    actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    this.logger.info({ operation: 'practice.accreditation.create', practiceId }, 'Submitting accreditation');
    return this.em.transactional(async (tx) => {
      const practice = await this.practicesRepo.findById(tx, practiceId);
      if (!practice) throw new ResourceNotFoundException('Práctica no encontrada', { practiceId });

      if (dto.practiceSiteId) {
        const site = await this.sitesRepo.findById(tx, dto.practiceSiteId);
        if (!site || site.practiceId !== practiceId) {
          throw new PreconditionFailedException('El sitio no pertenece a la práctica', {
            practiceId,
            siteId: dto.practiceSiteId,
          });
        }
      }

      const accreditation = this.accreditationsRepo.create(tx, {
        practiceId,
        practiceSiteId: dto.practiceSiteId,
        accreditationTypeConceptId: dto.accreditationTypeConceptId ?? PRAC.ACCRED_TYPE_ISO,
        accreditationNumber: dto.accreditationNumber,
        issuerTenantId: dto.issuerTenantId,
        issuerName: dto.issuerName,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        evidenceFileId: dto.evidenceFileId,
        verificationStatusConceptId: PRAC.ACCRED_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: accreditation.id,
        practiceId: accreditation.practiceId,
        verificationStatus: accreditation.verificationStatusConceptId,
        createdAt: accreditation.createdAt,
      };
    });
  }

  /** UC-14-03: verifica (PENDING->VERIFIED) o caduca (->EXPIRED) una acreditación. */
  async verify(
    id: string,
    dto: VerifyAccreditationDto,
    actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    const decision = dto.decision ?? 'VERIFIED';
    this.logger.info({ operation: 'practice.accreditation.verify', id, decision }, 'Verifying accreditation');
    return this.em.transactional(async (tx) => {
      const accreditation = await this.accreditationsRepo.findById(tx, id);
      if (!accreditation) throw new ResourceNotFoundException('Acreditación no encontrada', { id });

      if (decision === 'VERIFIED') {
        if (accreditation.verificationStatusConceptId !== PRAC.ACCRED_PENDING) {
          throw new PreconditionFailedException('La acreditación no está pendiente de verificación', { id });
        }
        accreditation.verificationStatusConceptId = PRAC.ACCRED_VERIFIED;
      } else {
        accreditation.verificationStatusConceptId = PRAC.ACCRED_EXPIRED;
      }
      touch(accreditation, actor.id);
      await tx.flush();
      return {
        id: accreditation.id,
        practiceId: accreditation.practiceId,
        verificationStatus: accreditation.verificationStatusConceptId,
        createdAt: accreditation.createdAt,
      };
    });
  }
}
