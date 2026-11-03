import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  UPLOAD_MIME_ALLOWLIST,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { HealthPractitionerProfilesRepository } from '../../../infrastructure/repositories';
import {
  ATTACHABLE_FILES_PORT,
  type AttachableFilesPort,
} from '../../ports/attachable-files.port';
import { ProfileOwnershipService } from '../../services/profile-ownership.service';
import { ProfilesErrorReason } from '../../../profiles.error-reasons';
import type { SetPractitionerPhotoDto } from '../../../presentation/dto';

/**
 * Caso de uso atómico hexagonal para gestión de la foto de perfil del profesional.
 * Cumple con la directiva LEAN (<= 150 líneas).
 */
@Injectable()
export class ManagePractitionerPhotoUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
    private readonly ownership: ProfileOwnershipService,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    @Inject(ATTACHABLE_FILES_PORT)
    private readonly attachableFiles: AttachableFilesPort,
  ) {
    this.logger.setContext(ManagePractitionerPhotoUseCase.name);
  }

  async setPhoto(
    profileId: string,
    dto: SetPractitionerPhotoDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    this.logger.info(
      { operation: 'profiles.practitioner.setPhoto', profileId, actorId: actor.id },
      'Setting practitioner profile photo',
    );

    await this.em.transactional(async (tx) => {
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException(
          'Profesional no encontrado',
          { profileId },
          ProfilesErrorReason.PRACTITIONER_PROFILE_NOT_FOUND,
        );
      }
      await this.attachableFiles.assertUsableBy(
        tx,
        dto.fileId,
        actor,
        {
          allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.IMAGE,
          operation: 'profiles.practitioner.setPhoto',
        },
        {
          subject: 'El archivo de la foto',
          notFound: 'El archivo de la foto no existe',
        },
      );
      practitioner.photoFileId = dto.fileId;
      touch(practitioner, actor.id);
      await tx.flush();
    });
  }

  async removePhoto(
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    this.logger.info(
      { operation: 'profiles.practitioner.removePhoto', profileId, actorId: actor.id },
      'Removing practitioner profile photo',
    );

    await this.em.transactional(async (tx) => {
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException(
          'Profesional no encontrado',
          { profileId },
          ProfilesErrorReason.PRACTITIONER_PROFILE_NOT_FOUND,
        );
      }
      practitioner.photoFileId = undefined;
      touch(practitioner, actor.id);
      await tx.flush();
    });
  }
}
