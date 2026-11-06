import { ForbiddenException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type {
  AttachableFileOptions,
  AttachableFileService,
} from '../../common/services/attachable-file.service';
import { notAvailable } from './lab-portal-results.service';

/**
 * A file the actor may reference from a report: uploaded by the actor, alive,
 * with a clean current version of an accepted type (`AttachableFileService`,
 * the rule of the organization logo). Ownership and not `files.tenant_id`:
 * every upload is stored under the platform tenant (`FilesService.createFile`),
 * so a tenant rule would refuse every file a laboratory uploads. Someone
 * else's file and a missing one answer the uniform 404 of the module.
 */
export async function assertActorFile(
  attachable: AttachableFileService,
  em: EntityManager,
  fileId: string,
  actor: AuthenticatedUser,
  options: AttachableFileOptions,
): Promise<void> {
  try {
    await attachable.assertUsableBy(em, fileId, actor, options);
  } catch (error) {
    if (
      error instanceof ForbiddenException ||
      error instanceof ResourceNotFoundException
    ) {
      throw notAvailable();
    }
    throw error;
  }
}
