import { Injectable } from '@nestjs/common';
import { PharmacyProvisioningService } from '../../../pharmacy/services/pharmacy-provisioning.service';
import type { PharmacyRegistrationPort } from '../../application/ports/pharmacy-registration.port';

/** La farmacia que nace con el alta, que provisiona `pharmacy` (P50). */
@Injectable()
export class PharmacyRegistrationAdapter implements PharmacyRegistrationPort {
  constructor(private readonly provisioning: PharmacyProvisioningService) {}

  provision(...args: Parameters<PharmacyRegistrationPort['provision']>) {
    return this.provisioning.provision(...args);
  }
}
