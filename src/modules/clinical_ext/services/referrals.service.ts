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
import { ReferralsRepository } from '../repositories';
import { CreateReferralDto, RespondReferralDto, ReferralResponseDto, StatusResultDto } from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/**
 * Referencias clínicas: emisión desde un encuentro (UC-18-07) y respuesta del
 * tenant destino aceptando o rechazando (UC-18-08). La unicidad
 * (encuentro, destino, especialidad) evita referencias duplicadas.
 */
@Injectable()
export class ReferralsService {
  constructor(
    private readonly em: EntityManager,
    private readonly referralsRepo: ReferralsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReferralsService.name);
  }

  /** UC-18-07: emite una referencia en estado solicitado. */
  async create(dto: CreateReferralDto, actor: AuthenticatedUser): Promise<ReferralResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.referral.create', patientProfileId: dto.patientProfileId },
      'Creating referral',
    );
    return this.em.transactional(async (tx) => {
      if (dto.sourceEncounterId && dto.targetProfileId && dto.specialtyConceptId) {
        const dup = await this.referralsRepo.findDuplicate(
          tx,
          dto.sourceEncounterId,
          dto.targetProfileId,
          dto.specialtyConceptId,
        );
        if (dup) {
          throw new ConflictException('Ya existe una referencia equivalente', {
            sourceEncounterId: dto.sourceEncounterId,
          });
        }
      }

      const referral = this.referralsRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        sourceEncounterId: dto.sourceEncounterId,
        referringProfileId: dto.referringProfileId,
        targetProfileId: dto.targetProfileId,
        targetTenantId: dto.targetTenantId,
        specialtyConceptId: dto.specialtyConceptId,
        reasonConceptId: dto.reasonConceptId,
        reasonText: dto.reasonText,
        priorityConceptId: dto.priorityConceptId ?? CEXT.REFERRAL_PRIORITY_ROUTINE,
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: referral.id,
        patientProfileId: referral.patientProfileId,
        statusConceptId: referral.statusConceptId,
        createdAt: referral.createdAt,
      };
    });
  }

  /** UC-18-08: el tenant destino acepta o rechaza la referencia. */
  async respond(
    referralId: string,
    dto: RespondReferralDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'clinical_ext.referral.respond', referralId, decision: dto.decision },
      'Responding referral',
    );
    return this.em.transactional(async (tx) => {
      const referral = await this.referralsRepo.findById(tx, referralId);
      if (!referral) throw new ResourceNotFoundException('Referencia no encontrada', { referralId });
      if (referral.statusConceptId !== CEXT.REFERRAL_REQUESTED) {
        throw new PreconditionFailedException('La referencia no está en estado solicitado', {
          referralId,
        });
      }

      referral.statusConceptId =
        dto.decision === 'ACCEPT' ? CEXT.REFERRAL_ACCEPTED : CEXT.REFERRAL_REJECTED;
      referral.respondedAt = new Date();
      touch(referral, actor.id);

      return { ok: true };
    });
  }
}
