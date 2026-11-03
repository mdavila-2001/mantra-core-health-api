import { Injectable } from '@nestjs/common';
import { OwnSiteProvisioningService } from '../../../practice/services/own-site-provisioning.service';
import type { OwnSiteProvisioningPort } from '../../application/ports/own-site.port';

/** Consultorio propio del profesional, que provisiona `practice`. */
@Injectable()
export class PracticeOwnSiteProvisioningAdapter implements OwnSiteProvisioningPort {
  constructor(private readonly provisioning: OwnSiteProvisioningService) {}

  provision(...args: Parameters<OwnSiteProvisioningPort['provision']>) {
    return this.provisioning.provision(...args);
  }
}
