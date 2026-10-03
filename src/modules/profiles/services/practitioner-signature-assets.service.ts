import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AttachableFileService } from '../../common/services';
import { HealthPractitionerProfiles } from '../entities';
import { ProfileOwnershipService } from './profile-ownership.service';
import {
  PractitionerSignatureAssetsDto,
  SetPractitionerSignatureAssetsDto,
} from '../dto/practitioner-signature-assets.dto';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

@Injectable()
export class PractitionerSignatureAssetsService {
  constructor(
    private readonly em: EntityManager,
    private readonly ownership: ProfileOwnershipService,
    private readonly files: AttachableFileService,
  ) {}

  async getOwn(
    actor: AuthenticatedUser,
  ): Promise<PractitionerSignatureAssetsDto> {
    const em = this.em.fork();
    const profileId = await this.ownership.requireOwnPractitionerProfileId(
      em,
      actor,
    );
    const profile = await em.findOne(HealthPractitionerProfiles, { profileId });
    if (!profile)
      throw new ResourceNotFoundException('Perfil profesional no encontrado');
    return this.project(profile);
  }

  async setOwn(
    dto: SetPractitionerSignatureAssetsDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerSignatureAssetsDto> {
    return this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(
        tx,
        actor,
      );
      const profile = await tx.findOne(
        HealthPractitionerProfiles,
        { profileId },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!profile)
        throw new ResourceNotFoundException('Perfil profesional no encontrado');
      // Validate both references before applying either change, in the same transaction.
      for (const fileId of [dto.signatureFileId, dto.sealFileId]) {
        if (fileId == null) continue;
        const { version } = await this.files.assertUsableBy(tx, fileId, actor, {
          allowedMimeTypes: IMAGE_TYPES,
          operation: 'profiles.practitioner.signatureAssets',
        });
        if (BigInt(version.sizeBytes) > BigInt(MAX_IMAGE_BYTES)) {
          throw new PreconditionFailedException(
            'La imagen supera el límite de 2 MB',
          );
        }
      }
      if (dto.signatureFileId !== undefined)
        profile.signatureFileId = dto.signatureFileId as string;
      if (dto.sealFileId !== undefined)
        profile.sealFileId = dto.sealFileId as string;
      if (dto.signatureFileId !== undefined || dto.sealFileId !== undefined) {
        touch(profile, actor.id);
        await tx.flush();
      }
      return this.project(profile);
    });
  }

  private project(
    profile: HealthPractitionerProfiles,
  ): PractitionerSignatureAssetsDto {
    return {
      signatureFileId: profile.signatureFileId ?? null,
      sealFileId: profile.sealFileId ?? null,
    };
  }
}
