import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  MedicationDispensations,
  MedicationDispensationLines,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una dispensación de medicamentos. */
export interface CreateDispensationData {
  pharmacyId: string;
  pharmacySiteId: string;
  patientProfileId: string;
  medicationRequestId?: string;
  inventoryReservationId?: string;
  dispensationStatusConceptId: string;
  dispensedAt?: Date;
  dispenserPractitionerProfileId?: string;
  idempotencyKey?: string;
  actorUserId?: string;
}

/** Datos de una línea de dispensación. */
export interface CreateDispensationLineData {
  medicationDispensationId: string;
  pharmacyProductId: string;
  inventoryLotId?: string;
  inventorySerialId?: string;
  dispensedQuantity: string;
  unitPriceAmount?: string;
  patientAmount?: string;
  insurerAmount?: string;
  actorUserId?: string;
}

/** Acceso a datos de las dispensaciones y sus líneas. */
@Injectable()
export class DispensationsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<MedicationDispensations | null> {
    return em.findOne(MedicationDispensations, { id });
  }

  findLines(
    em: EntityManager,
    dispensationId: string,
  ): Promise<MedicationDispensationLines[]> {
    return em.find(MedicationDispensationLines, {
      medicationDispensationId: dispensationId,
    });
  }

  create(
    em: EntityManager,
    data: CreateDispensationData,
  ): MedicationDispensations {
    return em.create(
      MedicationDispensations,
      {
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        patientProfileId: data.patientProfileId,
        medicationRequestId: data.medicationRequestId,
        inventoryReservationId: data.inventoryReservationId,
        dispensationStatusConceptId: data.dispensationStatusConceptId,
        dispensedAt: data.dispensedAt,
        dispenserPractitionerProfileId: data.dispenserPractitionerProfileId,
        idempotencyKey: data.idempotencyKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLine(
    em: EntityManager,
    data: CreateDispensationLineData,
  ): MedicationDispensationLines {
    return em.create(
      MedicationDispensationLines,
      {
        medicationDispensationId: data.medicationDispensationId,
        pharmacyProductId: data.pharmacyProductId,
        inventoryLotId: data.inventoryLotId,
        inventorySerialId: data.inventorySerialId,
        dispensedQuantity: data.dispensedQuantity,
        unitPriceAmount: data.unitPriceAmount,
        patientAmount: data.patientAmount,
        insurerAmount: data.insurerAmount,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
