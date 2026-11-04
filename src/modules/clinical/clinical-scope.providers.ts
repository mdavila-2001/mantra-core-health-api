import type { Provider } from '@nestjs/common';
import { ClinicalAccessGrantsRepository } from '../authz/repositories';
import {
  ConsentProvisionsRepository,
  ConsentsRepository,
} from '../consent/repositories';
import { ClinicalScopeRepository } from './repositories/clinical-scope.repository';
import { ClinicalGranularScopeService } from './services/clinical-granular-scope.service';
import { ClinicalScopeFilterService } from './services/clinical-scope-filter.service';

/**
 * What the read scope needs, provided as bare classes (stateless over the
 * `EntityManager`) so neither `ConsentModule` nor `AuthzModule` is imported
 * and no cycle opens: the same way `ClinicalModule` already provides
 * `CareRelationshipsRepository` (which these services also use).
 */
export const CLINICAL_SCOPE_PROVIDERS: Provider[] = [
  ClinicalAccessGrantsRepository,
  ConsentsRepository,
  ConsentProvisionsRepository,
  ClinicalScopeRepository,
  ClinicalGranularScopeService,
  ClinicalScopeFilterService,
];

/** The part of the scope machinery the chart and diagnostics modules also use. */
export const CLINICAL_SCOPE_EXPORTS: Provider[] = [
  ClinicalScopeRepository,
  ClinicalScopeFilterService,
];
