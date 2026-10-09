import { Injectable } from '@nestjs/common';
import { PractitionerSitesService } from '../../../practice/services';
import { findPractitionerNames } from '../../../profiles/read/practitioner-names';
import type {
  PractitionerDirectoryPort,
  ResourceRef,
} from '../../application/ports/practitioner-directory.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';
import type { ResourceSiteDto } from '../../presentation/dto';

/** Implementa el directorio de profesionales sobre `profiles` y `practice`. */
@Injectable()
export class PracticeProfilesDirectoryAdapter implements PractitionerDirectoryPort {
  constructor(private readonly sites: PractitionerSitesService) {}

  findPractitionerNames(
    uow: UnitOfWork,
    profileIds: readonly string[],
  ): Promise<Map<string, string>> {
    return findPractitionerNames(uow, profileIds);
  }

  resolveSitesForResources(
    refs: readonly ResourceRef[],
    tenantId: string,
  ): Promise<Map<string, ResourceSiteDto>> {
    return this.sites.resolveSitesForResources(refs, tenantId);
  }
}
