import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { AuthenticatedUser } from '../../../../common';
import { ClinicalReadService } from '../../../clinical/services';
import type { ClinicalPatientHistoryPort } from '../../application/ports/clinical-patient-history.port';

/** Resolves clinical history access lazily to avoid the existing module cycle. */
@Injectable()
export class ClinicalPatientHistoryAdapter
  implements ClinicalPatientHistoryPort
{
  constructor(private readonly moduleRef: ModuleRef) {}

  assertCanReadHistory(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.moduleRef
      .get(ClinicalReadService, { strict: false })
      .assertCanReadHistory(patientProfileId, actor);
  }
}
