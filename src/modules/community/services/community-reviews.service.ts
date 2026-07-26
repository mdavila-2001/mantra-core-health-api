import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { PublicProfilesRepository, ReviewsRepository } from '../repositories';
import { COMM, REVIEW_DIMENSION_BY_CODE } from '../community.concepts';
import { CreateReviewDto, ReviewResponseDto } from '../dto';

/**
 * Reviews verificadas de servicio (UC-19-11). Comprueba que el perfil objetivo
 * acepte reviews y que no exista ya una review verificada del mismo paciente para
 * el mismo encuentro. Nunca expone el `verified_encounter_id`.
 */
@Injectable()
export class CommunityReviewsService {
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly reviewsRepo: ReviewsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityReviewsService.name);
  }

  /** UC-19-11: publica una review verificada con puntuaciones por dimensión. */
  async publishReview(
    profileId: string,
    dto: CreateReviewDto,
    actor: AuthenticatedUser,
  ): Promise<ReviewResponseDto> {
    this.logger.info({ operation: 'community.review.publish', profileId }, 'Publishing service review');
    return this.em.transactional(async (tx) => {
      const target = await this.profilesRepo.findById(tx, profileId);
      if (!target) throw new ResourceNotFoundException('Perfil objetivo no encontrado', { profileId });
      if (target.acceptsReviews === false) {
        throw new PreconditionFailedException('El perfil no acepta reviews', { profileId });
      }

      if (dto.verifiedEncounterId) {
        const existing = await this.reviewsRepo.findByReviewerEncounter(
          tx,
          dto.reviewerPatientProfileId,
          profileId,
          dto.verifiedEncounterId,
        );
        if (existing) {
          throw new ConflictException('Ya existe una review verificada para este encuentro', {
            profileId,
          });
        }
      }

      const verified = !!dto.verifiedEncounterId;
      const review = this.reviewsRepo.create(tx, {
        targetPublicProfileId: profileId,
        reviewerPatientProfileId: dto.reviewerPatientProfileId,
        verifiedEncounterId: dto.verifiedEncounterId,
        overallRating: dto.overallRating,
        reviewText: dto.reviewText,
        reviewerDisplayModeConceptId:
          dto.displayMode === 'ANONYMOUS' ? COMM.REVIEW_DISPLAY_ANONYMOUS : COMM.REVIEW_DISPLAY_REAL_NAME,
        verificationStatusConceptId: verified ? COMM.REVIEW_VERIFIED : COMM.REVIEW_UNVERIFIED,
        moderationStatusConceptId: COMM.MODERATION_PENDING,
        publicationStatusConceptId: COMM.PUBLICATION_PUBLISHED,
        publishedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      let dimensionCount = 0;
      for (const d of dto.dimensions ?? []) {
        this.reviewsRepo.createDimensionScore(tx, review.id, REVIEW_DIMENSION_BY_CODE[d.dimension], d.score);
        dimensionCount++;
      }

      return { id: review.id, overallRating: review.overallRating, verified, dimensionCount };
    });
  }
}
