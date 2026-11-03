import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ClinicalReadService } from '../../../clinical/services';
import type { AuthenticatedUser } from '../../../../common';
import type { ClinicalPatientHistoryAccessPort } from '../../application/ports/clinical-patient-history-access.port';

/** Adaptador perezoso al control de acceso del contexto clínico. */
@Injectable()
export class ClinicalPatientHistoryAccessAdapter implements ClinicalPatientHistoryAccessPort {
  constructor(private readonly moduleRef: ModuleRef) {}

  assertCanReadHistory(
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return this.moduleRef
      .get(ClinicalReadService, { strict: false })
      .assertCanReadHistory(profileId, actor);
  }
}
