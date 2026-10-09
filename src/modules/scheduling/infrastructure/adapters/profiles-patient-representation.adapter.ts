import { Injectable } from '@nestjs/common';
import { PatientRepresentationService } from '../../../profiles/services/patient-representation.service';
import type { AuthenticatedUser } from '../../../../common';
import type { PatientRepresentationPort } from '../../application/ports/patient-representation.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Implementa la representación de pacientes sobre el servicio de `profiles`. */
@Injectable()
export class ProfilesPatientRepresentationAdapter implements PatientRepresentationPort {
  constructor(private readonly representation: PatientRepresentationService) {}

  assertMayActForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    uow?: UnitOfWork,
  ): Promise<void> {
    return this.representation.assertMayActForPatient(
      patientProfileId,
      actor,
      uow,
    );
  }

  representsPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    uow?: UnitOfWork,
  ): Promise<boolean> {
    return this.representation.representsPatient(patientProfileId, actor, uow);
  }

  findActiveProxiedPatientIds(
    userId: string,
    uow?: UnitOfWork,
  ): Promise<Set<string>> {
    return this.representation.findActiveProxiedPatientIds(userId, uow);
  }
}
