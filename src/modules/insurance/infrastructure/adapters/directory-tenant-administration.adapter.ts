import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import { TenantAdministrationService } from '../../../directory/services';
import type { DirectoryTenantAdministrationPort } from '../../application/ports/directory-tenant-administration.port';

/** Adapter to directory's canonical tenant membership policy. */
@Injectable()
export class DirectoryTenantAdministrationAdapter implements DirectoryTenantAdministrationPort {
  constructor(private readonly service: TenantAdministrationService) {}

  assertCanAdminister(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.service.assertCanAdminister(em, tenantId, actor);
  }

  canAdminister(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    return this.service.canAdminister(em, tenantId, actor);
  }

  assertCanRead(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.service.assertCanRead(em, tenantId, actor);
  }
}
