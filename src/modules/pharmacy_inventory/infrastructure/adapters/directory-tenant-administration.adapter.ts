import { Injectable } from '@nestjs/common';
import { TenantAdministrationService } from '../../../directory/services/tenant-administration.service';
import type { AuthenticatedUser } from '../../../../common';
import type { DirectoryTenantAdministrationPort } from '../../application/ports/directory-tenant-administration.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Adaptador local a la autorización de tenant del contexto directory. */
@Injectable()
export class DirectoryTenantAdministrationAdapter implements DirectoryTenantAdministrationPort {
  constructor(
    private readonly tenantAdministration: TenantAdministrationService,
  ) {}

  canAdminister(
    uow: UnitOfWork,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    return this.tenantAdministration.canAdminister(uow, tenantId, actor);
  }
}
