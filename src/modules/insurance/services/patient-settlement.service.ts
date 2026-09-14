import { Injectable } from '@nestjs/common';
import { IsolationLevel } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import {
  unavailableSettlement,
  type PatientSettlementProjection,
} from '../dto/patient-settlement.dto';
import {
  PatientSettlementRepository,
  type SettlementOrigin,
} from '../repositories/patient-settlement.repository';
import { LinkedClaimOrderService } from './linked-claim-order.service';
import { projectPatientSettlement } from './patient-settlement-projection';

@Injectable()
export class PatientSettlementService {
  constructor(
    private readonly repository: PatientSettlementRepository,
    private readonly orders: LinkedClaimOrderService,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly patients: PatientProfilesRepository,
  ) {}

  /** El actor se resuelve desde el vínculo persistente, nunca desde un pid declarado. */
  async forOrders(
    em: EntityManager,
    actorUserId: string,
    origin: SettlementOrigin,
    orderIds: readonly string[],
  ): Promise<Map<string, PatientSettlementProjection>> {
    const result = new Map(orderIds.map((id) => [id, unavailableSettlement()]));
    if (!orderIds.length) return result;
    return em.transactional(
      async (tx) => {
        const link = await this.accountLinks.findActiveByUser(tx, actorUserId);
        if (!link) return result;
        const patient = await this.patients.findById(tx, link.personId);
        if (!patient) return result;
        const authorizedIds = await this.repository.ownedOrders(
          tx,
          patient.profileId,
          origin,
          orderIds,
        );
        if (!authorizedIds.length) return result;
        // Recién después de comprobar titularidad se consultan pólizas y EOB.
        const batch = await this.repository.load(
          tx,
          patient.profileId,
          origin,
          authorizedIds,
        );
        const snapshots = await this.orders.loadSnapshots(
          tx,
          batch.claims,
          batch.lines,
        );
        for (const id of authorizedIds) {
          const claims = batch.claims.filter(
            (claim) =>
              (origin === 'PHARMACY'
                ? claim.inventoryReservationId
                : claim.serviceRequestId) === id,
          );
          result.set(
            id,
            projectPatientSettlement(
              patient.profileId,
              claims,
              batch,
              snapshots,
            ),
          );
        }
        return result;
      },
      { isolationLevel: IsolationLevel.REPEATABLE_READ, readOnly: true },
    );
  }

  activeClaimForDispensation(
    em: EntityManager,
    orderId: string,
  ): Promise<string | undefined> {
    return this.repository.activeClaimForDispensation(em, orderId);
  }
}
