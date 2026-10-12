import { Injectable } from '@nestjs/common';
import { ProfileOwnershipService } from '../../../profiles/application/services/profile-ownership.service';
import type { PatientOwnershipPort } from '../../application/ports/patient-ownership.port';

@Injectable()
export class PatientOwnershipAdapter implements PatientOwnershipPort {
  constructor(private readonly ownership: ProfileOwnershipService) {}

  assertOwnsPatientProfile(
    ...args: Parameters<PatientOwnershipPort['assertOwnsPatientProfile']>
  ) {
    return this.ownership.assertOwnsPatientProfile(...args);
  }
}
