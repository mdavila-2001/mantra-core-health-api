import { Module } from '@nestjs/common';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../profiles/repositories';
import { PatientSettlementRepository } from './repositories/patient-settlement.repository';
import { LinkedClaimOrderService } from './services/linked-claim-order.service';
import { PatientSettlementService } from './services/patient-settlement.service';

/** Puerto de lectura sin dependencias circulares con los módulos operativos. */
@Module({
  providers: [
    PatientSettlementRepository,
    LinkedClaimOrderService,
    PatientSettlementService,
    PatientProfilesRepository,
    PersonAccountLinksRepository,
  ],
  exports: [PatientSettlementService],
})
export class InsurancePatientSettlementModule {}
