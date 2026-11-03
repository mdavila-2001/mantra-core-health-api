import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DuplicateStudyDetector } from '../../../clinical/services/duplicate-study-detector';
import type { DuplicateStudyDescriptionPort } from '../../application/ports/duplicate-study-description.port';

/** Adapts clinical's duplicate-study description to the insurance-owned port. */
@Injectable()
export class DuplicateStudyDescriptionAdapter implements DuplicateStudyDescriptionPort {
  constructor(private readonly detector: DuplicateStudyDetector) {}

  describeByReportId(
    em: EntityManager,
    reportId: string,
    requesterTenantId: string,
    referenceDate: Date,
    includeConclusion: false,
  ) {
    return this.detector.describeByReportId(
      em,
      reportId,
      requesterTenantId,
      referenceDate,
      includeConclusion,
    );
  }
}
