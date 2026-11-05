import { Inject, Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { HealthPractitionerProfiles } from '../../entities';
import { PROF } from '../../profiles.concepts';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import type { OwnAdmissionDto } from '../../presentation/dto/admissions.dto';
import {
  ADMISSION_NOTICE_PORT,
  type AdmissionNoticePort,
} from '../ports/admission-notice.port';
import { PractitionerAdmissionsReadService } from './practitioner-admissions-read.service';
import {
  PractitionerAdmissionsService,
  type AdmissionAttestation,
} from './practitioner-admissions.service';

/**
 * The practitioner starts their own verification request.
 *
 * Registration opens the admission; this covers the practitioners who exist
 * with a pending profile but never got one. `resubmit` needs an existing
 * admission, so without this path the staff queue has nothing to review.
 */
@Injectable()
export class PractitionerAdmissionSubmitService {
  constructor(
    private readonly em: EntityManager,
    private readonly admissions: PractitionerAdmissionsService,
    private readonly read: PractitionerAdmissionsReadService,
    @Inject(ADMISSION_NOTICE_PORT)
    private readonly notices: AdmissionNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerAdmissionSubmitService.name);
  }

  /**
   * Opens the admission of the session's practitioner (PRACT_VERIF_PENDING).
   *
   * - No professional profile: 404 `ADMISSION_NOT_FOUND`, same as `own()`.
   * - No attestation: 412 `ADMISSION_ATTESTATION_REQUIRED`.
   * - An admission already exists: 409 `ADMISSION_ALREADY_EXISTS` (use resubmit).
   * - Profile not pending: 412 `ADMISSION_NOT_PENDING`.
   */
  async submitOwn(
    actor: AuthenticatedUser,
    attestation?: AdmissionAttestation,
  ): Promise<OwnAdmissionDto> {
    const dto = await this.em.transactional(async (tx) => {
      const personId = await this.read.ownPersonId(tx, actor);
      if (!personId) {
        throw new ResourceNotFoundException(
          'Admisión no encontrada',
          {},
          ProfilesErrorReason.ADMISSION_NOT_FOUND,
        );
      }
      if (!attestation) {
        throw new PreconditionFailedException(
          'Debe aceptar la declaración para enviar la solicitud',
          { field: 'attested' },
          ProfilesErrorReason.ADMISSION_ATTESTATION_REQUIRED,
        );
      }
      // The profile row serializes two concurrent submits of the same practitioner.
      const profile = await tx.findOne(
        HealthPractitionerProfiles,
        { profileId: personId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (await this.read.currentOf(tx, actor)) {
        throw new ConflictException(
          'Ya tiene una solicitud de verificación: reenvíela en lugar de abrir otra',
          {},
          ProfilesErrorReason.ADMISSION_ALREADY_EXISTS,
        );
      }
      if (profile?.verificationStatusConceptId !== PROF.PRACT_VERIF_PENDING) {
        throw new PreconditionFailedException(
          'Su perfil ya no está pendiente de verificación',
          {},
          ProfilesErrorReason.ADMISSION_NOT_PENDING,
        );
      }
      const admission = await this.admissions.openForRegistration(tx, {
        practitionerProfileId: personId,
        actorUserId: actor.id,
        attestation,
      });
      return {
        admission,
        own: await this.read.ownOf(tx, admission),
      };
    });
    await this.emitReceived(
      dto.admission.id,
      dto.admission.practitionerProfileId,
    );
    return dto.own;
  }

  /** Notices go out after commit and never break the submission. */
  private async emitReceived(
    admissionId: string,
    practitionerProfileId: string,
  ): Promise<void> {
    try {
      await this.notices.emit({
        kind: 'RECEIVED',
        admissionId,
        statusCode: 'ENVIADA',
        practitionerProfileId,
      });
    } catch (error) {
      this.logger.warn(
        {
          operation: 'profiles.admission.notice',
          kind: 'RECEIVED',
          err: error,
        },
        'Admission notice failed; the submission stands',
      );
    }
  }
}
