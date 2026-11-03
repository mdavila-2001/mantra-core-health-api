import { Injectable } from '@nestjs/common';
import { AuditTrailService } from '../../../audit/services';
import type { InsuranceAuditTrailPort } from '../../application/ports/audit-trail.port';

@Injectable()
export class AuditTrailAdapter implements InsuranceAuditTrailPort {
  constructor(private readonly audit: AuditTrailService) {}

  record(...args: Parameters<InsuranceAuditTrailPort['record']>) {
    return this.audit.record(...args);
  }
}
