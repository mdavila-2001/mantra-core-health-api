import { Test } from '@nestjs/testing';
import { InsurancePatientSettlementModule } from './insurance-patient-settlement.module';
import { LinkedClaimOrderService } from './application/services/linked-claim-order.service';
import { PatientSettlementService } from './application/services/patient-settlement.service';
import { PatientSettlementRepository } from './infrastructure/repositories/patient-settlement.repository';

describe('InsurancePatientSettlementModule wiring', () => {
  it('resolves settlement services and their repositories without opening a database', async () => {
    const unit = await Test.createTestingModule({
      imports: [InsurancePatientSettlementModule],
    })
      .overrideProvider(PatientSettlementRepository)
      .useValue({})
      .compile();

    expect(unit.get(LinkedClaimOrderService)).toBeInstanceOf(
      LinkedClaimOrderService,
    );
    expect(unit.get(PatientSettlementService)).toBeInstanceOf(
      PatientSettlementService,
    );
    await unit.close();
  });
});
