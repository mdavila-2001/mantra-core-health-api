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
import { ProfessionalCredentialsRepository } from '../../../infrastructure/repositories';
import {
  ATTACHABLE_FILES_PORT,
  type AttachableFilesPort,
} from '../../ports/attachable-files.port';
import { ProfileOwnershipService } from '../../services/profile-ownership.service';
import { ProfilesErrorReason } from '../../../profiles.error-reasons';
import { BO_PROFESSION_CONCEPT_IDS } from '../../../../../common/seed/bo-professions.catalog';
import type {
  AddOwnCredentialDto,
  OwnCredentialResponseDto,
  UpdateOwnCredentialDto,
} from '../../../presentation/dto';

function assertProfession(professionConceptId: string | undefined): void {
  if (
    professionConceptId !== undefined &&
    !BO_PROFESSION_CONCEPT_IDS.has(professionConceptId)
  ) {
    throw new PreconditionFailedException(
      'Esa profesión no está en la Clasificación de Ocupaciones de Bolivia',
      { professionConceptId },
    );
  }
}

/**
 * Caso de uso atómico hexagonal para gestión de títulos y credenciales profesionales propias.
 * Cumple con la directiva LEAN (<= 150 líneas).
 */
@Injectable()
export class ManagePractitionerCredentialsUseCase {
  public static readonly CREDENTIAL_TYPES: readonly string[] = [
    PROF.CREDENTIAL_TYPE_DEGREE,
    PROF.CREDENTIAL_TYPE_DIPLOMA,
    PROF.CREDENTIAL_TYPE_MASTER,
    PROF.CREDENTIAL_TYPE_DOCTORATE,
    PROF.CREDENTIAL_TYPE_SPECIALTY,
  ];

  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
    private readonly ownership: ProfileOwnershipService,
    private readonly credentialsRepo: ProfessionalCredentialsRepository,
    @Inject(ATTACHABLE_FILES_PORT)
    private readonly attachableFiles: AttachableFilesPort,
  ) {
    this.logger.setContext(ManagePractitionerCredentialsUseCase.name);
  }

  async addOwnCredential(
    dto: AddOwnCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<OwnCredentialResponseDto> {
    if (!ManagePractitionerCredentialsUseCase.CREDENTIAL_TYPES.includes(dto.credentialTypeConceptId)) {
      throw new PreconditionFailedException(
        'Ese concepto no es un tipo de credencial profesional',
        { credentialTypeConceptId: dto.credentialTypeConceptId },
        ProfilesErrorReason.CREDENTIAL_TYPE_INVALID,
      );
    }
    assertProfession(dto.professionConceptId);

    this.logger.info(
      { operation: 'profiles.credential.addOwn', actorId: actor.id },
      'Adding own professional credential',
    );

    const created = await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(tx, actor);

      if (dto.fileId !== undefined) {
        await this.attachableFiles.assertUsableBy(
          tx,
          dto.fileId,
          actor,
          {
            allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.DOCUMENT,
            operation: 'profiles.credential.addOwn',
          },
          {
            subject: 'El archivo del título',
            notFound: 'El archivo del título no existe',
          },
        );
      }

      const credential = this.credentialsRepo.create(tx, {
        practitionerProfileId: profileId,
        credentialTypeConceptId: dto.credentialTypeConceptId,
        number: dto.number.trim(),
        issuingInstitutionText: dto.issuingInstitutionText?.trim(),
        issuingCityText: dto.issuingCityText?.trim() || undefined,
        issuingCountryText: dto.issuingCountryText?.trim() || undefined,
        professionConceptId: dto.professionConceptId,
        titleText: dto.titleText?.trim() || undefined,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        fileId: dto.fileId,
        stateConceptId: PROF.CRED_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();
      return credential;
    });

    return {
      id: created.id,
      credentialTypeConceptId: created.credentialTypeConceptId,
      number: created.number,
      issuingInstitutionText: created.issuingInstitutionText,
      issuingCityText: created.issuingCityText,
      issuingCountryText: created.issuingCountryText,
      professionConceptId: created.professionConceptId,
      titleText: created.titleText,
      issueDate: created.issueDate,
      stateConceptId: created.stateConceptId,
      fileId: created.fileId,
      createdAt: created.createdAt,
    };
  }

  async updateOwnCredential(
    credentialId: string,
    dto: UpdateOwnCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (
      dto.credentialTypeConceptId !== undefined &&
      !ManagePractitionerCredentialsUseCase.CREDENTIAL_TYPES.includes(dto.credentialTypeConceptId)
    ) {
      throw new PreconditionFailedException(
        'Ese concepto no es un tipo de credencial profesional',
        { credentialTypeConceptId: dto.credentialTypeConceptId },
      );
    }
    assertProfession(dto.professionConceptId);

    await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const credential = await this.credentialsRepo.findByIdForUpdate(tx, credentialId);
      if (!credential || credential.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Título no encontrado', { credentialId });
      }
      if (credential.stateConceptId !== PROF.CRED_PENDING) {
        throw new PreconditionFailedException(
          'Ese título ya fue verificado o rechazado; no se puede editar',
          { credentialId, stateConceptId: credential.stateConceptId },
        );
      }

      if (dto.fileId !== undefined) {
        await this.attachableFiles.assertUsableBy(
          tx,
          dto.fileId,
          actor,
          {
            allowedMimeTypes: UPLOAD_MIME_ALLOWLIST.DOCUMENT,
            operation: 'profiles.credential.updateOwn',
          },
          {
            subject: 'El archivo del título',
            notFound: 'El archivo del título no existe',
          },
        );
      }

      if (dto.credentialTypeConceptId !== undefined) credential.credentialTypeConceptId = dto.credentialTypeConceptId;
      if (dto.number !== undefined) credential.number = dto.number.trim();
      if (dto.issuingInstitutionText !== undefined) credential.issuingInstitutionText = dto.issuingInstitutionText.trim();
      if (dto.issuingCityText !== undefined) credential.issuingCityText = dto.issuingCityText.trim() || undefined;
      if (dto.issuingCountryText !== undefined) credential.issuingCountryText = dto.issuingCountryText.trim() || undefined;
      if (dto.professionConceptId !== undefined) credential.professionConceptId = dto.professionConceptId;
      if (dto.titleText !== undefined) credential.titleText = dto.titleText.trim() || undefined;
      if (dto.issueDate !== undefined) credential.issueDate = new Date(dto.issueDate);
      if (dto.fileId !== undefined) credential.fileId = dto.fileId;
      touch(credential, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.credential.updateOwn', credentialId, actorId: actor.id },
        'Own professional credential updated',
      );
    });
  }

  async removeOwnCredential(credentialId: string, actor: AuthenticatedUser): Promise<void> {
    await this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const credential = await this.credentialsRepo.findByIdForUpdate(tx, credentialId);
      if (!credential || credential.practitionerProfileId !== profileId) {
        throw new ResourceNotFoundException('Título no encontrado', { credentialId });
      }
      if (credential.stateConceptId !== PROF.CRED_PENDING) {
        throw new PreconditionFailedException(
          'Ese título ya fue verificado o rechazado; no se puede retirar',
          { credentialId, stateConceptId: credential.stateConceptId },
        );
      }

      this.credentialsRepo.remove(tx, credential);
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.credential.removeOwn', credentialId, actorId: actor.id },
        'Own professional credential removed',
      );
    });
  }
}
