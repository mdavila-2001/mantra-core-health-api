import { Injectable } from '@nestjs/common';
import { PracticeTenantLookupService } from '../../../practice/services';
import type { InsurancePracticeTenantLookupPort } from '../../application/ports/practice-tenant-lookup.port';

/** Adapts practice's tenant lookup to the insurance-owned port. */
@Injectable()
export class PracticeTenantLookupAdapter implements InsurancePracticeTenantLookupPort {
  constructor(private readonly service: PracticeTenantLookupService) {}

  findActivePracticeIdsForTenant(tenantId: string): Promise<string[]> {
    return this.service.findActivePracticeIdsForTenant(tenantId);
  }

  findTenantOfPractice(practiceId: string): Promise<string | null> {
    return this.service.findTenantOfPractice(practiceId);
  }
}
