import { Injectable } from '@nestjs/common';
import { FormInstanceOriginValidator } from '../../../forms/services/form-instance-origin.validator';
import type { FormOriginPort } from '../../application/ports/form-origin.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Implementa la validación del origen sobre el validador de `forms`. */
@Injectable()
export class FormsOriginAdapter implements FormOriginPort {
  constructor(private readonly validator: FormInstanceOriginValidator) {}

  assertUsableOrigin(
    uow: UnitOfWork,
    formInstanceId: string,
    encounterId: string | null,
  ): Promise<void> {
    return this.validator.assertUsableOrigin(uow, formInstanceId, encounterId);
  }
}
