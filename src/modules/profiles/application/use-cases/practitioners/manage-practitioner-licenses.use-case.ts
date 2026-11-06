import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  UPLOAD_MIME_ALLOWLIST,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { PROF } from '../../../profiles.concepts';
import { JurisdictionAuthorizationsRepository } from '../../../infrastructure/repositories';
import {
  ATTACHABLE_FILES_PORT,
  type AttachableFilesPort,
} from '../../ports/attachable-files.port';
import {
  PRACTITIONER_CONTEXT_PORT,
  type PractitionerContextPort,
} from '../../ports/practitioner-context.port';
import { ProfileOwnershipService } from '../../services/profile-ownership.service';
import type { UpdateOwnLicenseDto } from '../../../presentation/dto';

/**
 * Caso de uso atómico hexagonal para corrección y retiro de matrículas profesionales propias.
 * Cumple con la directiva LEAN (<= 150 líneas).
 */
@Injectable()
export class ManagePractitionerLicensesUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
    private readonly ownership: ProfileOwnershipService,
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    @Inject(ATTACHABLE_FILES_PORT)
    private readonly attachableFiles: AttachableFilesPort,
    @Inject(PRACTITIONER_CONTEXT_PORT)
    private readonly practitionerContext: PractitionerContextPort,
  ) {
    this.logger.setContext(ManagePractitionerLicensesUseCase.name);
  }

  async updateOwnLicense(
    licenseId: string,
    dto: UpdateOwnLicenseDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const license = await this.lockOwnEditableLicense(tx, licenseId, actor, 'corregir');

      if (dto.fileId !== undefined) {
        await this.attachableFiles.assertUsableBy(
          tx,
          dto.fileId,
          actor,
          {
            allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.DOCUMENT,
            operation: 'profiles.authorization.updateOwn',
          },
          {
            subject: 'El archivo de la matrícula',
            notFound: 'El archivo de la matrícula no existe',
          },
        );
        license.fileId = dto.fileId;
      }
      if (dto.licenseNumber !== undefined) {
        license.licenseNumber = dto.licenseNumber.trim();
      }
      if (dto.regulatoryAuthority !== undefined) {
        license.regulatoryAuthority = dto.regulatoryAuthority.trim();
      }
      if (dto.validFrom !== undefined) {
        license.validFrom = new Date(dto.validFrom);
      }
      touch(license, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.authorization.updateOwn', licenseId, actorId: actor.id },
        'Own license updated',
      );
    });
  }

  async removeOwnLicense(
    licenseId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const license = await this.lockOwnEditableLicense(tx, licenseId, actor, 'retirar');

      if (await this.practitionerContext.hasAuthorizationHistory(tx, licenseId)) {
        throw new PreconditionFailedException(
          'Esa matrícula ya tiene historial de auditoría; no se puede borrar',
          { licenseId },
        );
      }

      this.authorizationsRepo.remove(tx, license);
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.authorization.removeOwn', licenseId, actorId: actor.id },
        'Own license removed',
      );
    });
  }

  private async lockOwnEditableLicense(
    tx: EntityManager,
    licenseId: string,
    actor: AuthenticatedUser,
    verb: 'corregir' | 'retirar',
  ) {
    const profileId = await this.ownership.requireOwnPractitionerProfileId(tx, actor);
    const license = await this.authorizationsRepo.findByIdForUpdate(tx, licenseId);
    if (!license || license.practitionerProfileId !== profileId) {
      throw new ResourceNotFoundException('Matrícula no encontrada', { licenseId });
    }
    if (license.stateConceptId !== PROF.AUTH_PENDING) {
      throw new PreconditionFailedException(
        `Esa matrícula ya no está pendiente; no se puede ${verb}`,
        { licenseId, stateConceptId: license.stateConceptId },
      );
    }
    if (await this.practitionerContext.hasOpenIdentityCase(tx, licenseId)) {
      throw new PreconditionFailedException(
        `Esa matrícula tiene una verificación en curso; no se puede ${verb}`,
        { licenseId },
      );
    }
    return license;
  }
}
