import { Injectable } from '@nestjs/common';
import {
  AdmitPatientUseCase,
  AssignBedUseCase,
  CancelLocationUseCase,
  DischargePatientUseCase,
  ReviewPlacementIncidentUseCase,
  SwapBedsUseCase,
  TransferPatientUseCase,
} from './inpatient/adt.use-cases';
import { InpatientReadUseCases } from './inpatient/inpatient-read.use-cases';

/**
 * Fachada de internación / ADT (F3, CONTRATO-F2-F5 §F3.3). Sin reglas: cada
 * movimiento es un caso de uso con su transacción. Incluye la consulta de
 * compatibilidad (el contrato la nombra `bed-compatibility.service.ts`; acá
 * es `InpatientReadUseCases.compatibility`, sobre la misma regla pura).
 */
@Injectable()
export class InpatientAdtService {
  constructor(
    private readonly admitUseCase: AdmitPatientUseCase,
    private readonly assignUseCase: AssignBedUseCase,
    private readonly transferUseCase: TransferPatientUseCase,
    private readonly swapUseCase: SwapBedsUseCase,
    private readonly dischargeUseCase: DischargePatientUseCase,
    private readonly cancelUseCase: CancelLocationUseCase,
    private readonly reviewUseCase: ReviewPlacementIncidentUseCase,
    private readonly reads: InpatientReadUseCases,
  ) {}

  admit(...a: Parameters<AdmitPatientUseCase['execute']>) {
    return this.admitUseCase.execute(...a);
  }
  assignBed(...a: Parameters<AssignBedUseCase['execute']>) {
    return this.assignUseCase.execute(...a);
  }
  transfer(...a: Parameters<TransferPatientUseCase['execute']>) {
    return this.transferUseCase.execute(...a);
  }
  swap(...a: Parameters<SwapBedsUseCase['execute']>) {
    return this.swapUseCase.execute(...a);
  }
  discharge(...a: Parameters<DischargePatientUseCase['execute']>) {
    return this.dischargeUseCase.execute(...a);
  }
  cancelLocation(...a: Parameters<CancelLocationUseCase['execute']>) {
    return this.cancelUseCase.execute(...a);
  }
  reviewIncident(...a: Parameters<ReviewPlacementIncidentUseCase['execute']>) {
    return this.reviewUseCase.execute(...a);
  }
  compatibility(...a: Parameters<InpatientReadUseCases['compatibility']>) {
    return this.reads.compatibility(...a);
  }
  stay(...a: Parameters<InpatientReadUseCases['stay']>) {
    return this.reads.stay(...a);
  }
  inpatients(...a: Parameters<InpatientReadUseCases['inpatients']>) {
    return this.reads.inpatients(...a);
  }
}
