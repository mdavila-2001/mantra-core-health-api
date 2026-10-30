import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { COMM } from '../../../community/community.concepts';
import { CommunityVerificationService } from '../../../community/services';
import type { PublicVerificationSealPort } from '../../application/ports/public-verification-seal.port';

/** El sello público de verificado, contra el módulo de comunidad. */
@Injectable()
export class CommunityVerificationSealAdapter implements PublicVerificationSealPort {
  constructor(private readonly verification: CommunityVerificationService) {}

  async grant(
    tx: EntityManager,
    input: {
      practitionerProfileId: string;
      actorUserId: string;
      evidenceRef: string;
      validTo?: Date;
    },
  ): Promise<void> {
    await this.verification.applyVerified(tx, {
      targetId: input.practitionerProfileId,
      methodConceptId: COMM.BADGE_METHOD_MANUAL_ADMIN,
      actorUserId: input.actorUserId,
      evidenceRef: input.evidenceRef,
      validTo: input.validTo,
    });
  }

  async revoke(
    tx: EntityManager,
    practitionerProfileId: string,
    actorUserId: string,
    reason: 'REVOKED' | 'EXPIRED',
  ): Promise<void> {
    await this.verification.applyRevoked(
      tx,
      practitionerProfileId,
      actorUserId,
      reason,
    );
  }
}
