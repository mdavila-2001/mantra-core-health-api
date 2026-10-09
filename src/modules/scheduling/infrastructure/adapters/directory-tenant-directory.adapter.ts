import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common';
import { TenantAdministrationService } from '../../../directory/services';
import { Persons } from '../../../profiles/entities';
import type { TenantDirectoryPort } from '../../application/ports/tenant-directory.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Implementa el directorio de organizaciones sobre `directory` y `profiles`. */
@Injectable()
export class DirectoryTenantDirectoryAdapter implements TenantDirectoryPort {
  constructor(private readonly tenantAdmin: TenantAdministrationService) {}

  assertCanRead(
    uow: UnitOfWork,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.tenantAdmin.assertCanRead(uow, tenantId, actor);
  }

  async findDisplayNames(
    uow: UnitOfWork,
    personIds: readonly string[],
  ): Promise<Map<string, string>> {
    const people =
      personIds.length > 0
        ? await uow.find(Persons, { id: { $in: [...personIds] } })
        : [];
    return new Map(
      people
        .filter((person) => (person.displayName ?? '') !== '')
        .map((person) => [person.id, person.displayName as string]),
    );
  }
}
