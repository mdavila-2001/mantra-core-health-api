import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  AttachableFileService,
  FileUploadService,
} from '../../common/services';
import { PublicProfileProjectionService } from '../../community/services';
import { TenantsRepository } from '../repositories';
import { TenantAdministrationService } from './tenant-administration.service';

const IMAGE_OPTIONS = {
  allowedCategoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  operation: 'directory.organization.logo',
};

/** Logo único en la vitrina existente, con autorización por organización. */
@Injectable()
export class OrganizationLogoService {
  constructor(
    private readonly em: EntityManager,
    private readonly tenants: TenantsRepository,
    private readonly permissions: TenantAdministrationService,
    private readonly profiles: PublicProfileProjectionService,
    private readonly attachable: AttachableFileService,
    private readonly uploads: FileUploadService,
  ) {}

  async get(tenantId: string, actor: AuthenticatedUser) {
    const em = this.em.fork();
    await this.permissions.assertCanRead(em, tenantId, actor);
    await this.assertTenant(em, tenantId);
    return { fileId: await this.profiles.getOrganizationLogo(em, tenantId) };
  }

  async set(tenantId: string, fileId: string | null, actor: AuthenticatedUser) {
    return this.em.transactional(async (em) => {
      await this.permissions.assertCanAdminister(em, tenantId, actor);
      const tenant = await this.assertTenant(em, tenantId);
      if (fileId !== null) {
        const { file, version } = await this.attachable.assertUsableBy(
          em,
          fileId,
          actor,
          IMAGE_OPTIONS,
        );
        this.assertNormal(file.sensitivityConceptId);
        if (Number(version.sizeBytes) > 2 * 1024 * 1024) {
          throw new PreconditionFailedException('El logo supera los 2 MB');
        }
      }
      await this.profiles.setOrganizationLogo(em, {
        tenantId,
        displayName: tenant.tradeName ?? tenant.legalName,
        fileId,
        actorUserId: actor.id,
      });
      return { fileId };
    });
  }

  async content(tenantId: string, actor: AuthenticatedUser) {
    const { fileId } = await this.get(tenantId, actor);
    if (!fileId)
      throw new ResourceNotFoundException('La organización no tiene logo');
    // Autoriza la relación tenant -> logo, no cualquier UUID proporcionado por el cliente.
    const { file } = await this.attachable.assertUsableForAuthorizedContext(
      this.em.fork(),
      fileId,
      IMAGE_OPTIONS,
    );
    this.assertNormal(file.sensitivityConceptId);
    return this.uploads.downloadForAuthorizedContext(
      fileId,
      IMAGE_OPTIONS.operation,
    );
  }

  private assertNormal(sensitivity: string) {
    if (sensitivity !== CONCEPTS.SENSITIVITY_NORMAL) {
      throw new PreconditionFailedException(
        'El logo debe ser una imagen de sensibilidad NORMAL',
      );
    }
  }

  private async assertTenant(em: EntityManager, tenantId: string) {
    const tenant = await this.tenants.findById(em, tenantId);
    if (!tenant) {
      throw new ResourceNotFoundException('Organización no encontrada');
    }
    return tenant;
  }
}
