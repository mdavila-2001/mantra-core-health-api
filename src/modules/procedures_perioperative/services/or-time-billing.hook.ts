import { Injectable } from '@nestjs/common';
import { OrTimeChargesService } from '../../billing/services/or-time-charges.service';
import type { CaseCompletedHook } from '../ports/case-completed.hook';

/**
 * Al completarse un caso, pide a Facturación el devengo de su tiempo de quirófano
 * (`OrTimeChargesService.run({ caseId })`, idempotente por caso).
 */
@Injectable()
export class OrTimeBillingHook implements CaseCompletedHook {
  /** @param charges - Devengo del tiempo de quirófano (F5e). */
  constructor(private readonly charges: OrTimeChargesService) {}

  /** @inheritdoc */
  async onCaseCompleted(caseId: string): Promise<void> {
    await this.charges.run({ caseId });
  }
}
