import { Injectable } from '@nestjs/common';
import { PatientSettlementService } from '../../../insurance/services/patient-settlement.service';
import type { InsurancePatientSettlementPort } from '../../application/ports/insurance-patient-settlement.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Adaptador local a las liquidaciones de pedidos del contexto insurance. */
@Injectable()
export class InsurancePatientSettlementAdapter implements InsurancePatientSettlementPort {
  constructor(private readonly settlements: PatientSettlementService) {}

  forOrders(uow: UnitOfWork, actorUserId: string, orderIds: readonly string[]) {
    return this.settlements.forOrders(uow, actorUserId, 'PHARMACY', orderIds);
  }

  activeClaimForDispensation(uow: UnitOfWork, orderId: string) {
    return this.settlements.activeClaimForDispensation(uow, orderId);
  }
}
