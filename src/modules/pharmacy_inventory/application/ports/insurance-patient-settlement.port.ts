import type { UnitOfWork } from './unit-of-work';
import type { PatientSettlementProjection } from '../../domain/order-settlement';

/** Lecturas de liquidación de insurance que farmacia necesita para sus pedidos. */
export interface InsurancePatientSettlementPort {
  forOrders(
    uow: UnitOfWork,
    actorUserId: string,
    orderIds: readonly string[],
  ): Promise<Map<string, PatientSettlementProjection>>;

  activeClaimForDispensation(
    uow: UnitOfWork,
    orderId: string,
  ): Promise<string | undefined>;
}

/** Token de inyección para las consultas de liquidación del paciente. */
export const INSURANCE_PATIENT_SETTLEMENT_PORT = Symbol(
  'INSURANCE_PATIENT_SETTLEMENT_PORT',
);
