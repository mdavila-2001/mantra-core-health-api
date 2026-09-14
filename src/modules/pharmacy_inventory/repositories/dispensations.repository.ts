import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  MedicationDispensations,
  MedicationDispensationLines,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una dispensación de medicamentos. */
export interface CreateDispensationData {
  insuranceClaimId?: string;
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a medication request.
   */
  medicationRequestId?: string;
  /**
   * Identificador asociado a inventory reservation.
   */
  inventoryReservationId?: string;
  /**
   * Identificador asociado a dispensation status concept.
   */
  dispensationStatusConceptId: string;
  /**
   * Valor de dispensed at mantenido por la instancia.
   */
  dispensedAt?: Date;
  /**
   * Identificador asociado a dispenser practitioner profile.
   */
  dispenserPractitionerProfileId?: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de una línea de dispensación. */
export interface CreateDispensationLineData {
  /**
   * Identificador asociado a medication dispensation.
   */
  medicationDispensationId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId?: string;
  /**
   * Identificador asociado a inventory serial.
   */
  inventorySerialId?: string;
  /**
   * Valor de dispensed quantity mantenido por la instancia.
   */
  dispensedQuantity: string;
  /**
   * Valor de unit price amount mantenido por la instancia.
   */
  unitPriceAmount?: string;
  /**
   * Valor de patient amount mantenido por la instancia.
   */
  patientAmount?: string;
  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  insurerAmount?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de las dispensaciones y sus líneas. */
@Injectable()
export class DispensationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<MedicationDispensations | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<MedicationDispensations | null> {
    return em.findOne(MedicationDispensations, { id });
  }

  /** Dispensación previa con la misma clave de idempotencia (retry seguro). */
  findByIdempotencyKey(
    em: EntityManager,
    pharmacyId: string,
    idempotencyKey: string,
  ): Promise<MedicationDispensations | null> {
    return em.findOne(MedicationDispensations, { pharmacyId, idempotencyKey });
  }

  /**
   * Obtiene find lines.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dispensationId - Identificador de dispensation.
   * @returns Resultado de find lines conforme al contrato `Promise<MedicationDispensationLines[]>`.
   */
  findLines(
    em: EntityManager,
    dispensationId: string,
  ): Promise<MedicationDispensationLines[]> {
    return em.find(MedicationDispensationLines, {
      medicationDispensationId: dispensationId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `MedicationDispensations`.
   */
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
        insuranceClaimId: data.insuranceClaimId,
        dispensationStatusConceptId: data.dispensationStatusConceptId,
        dispensedAt: data.dispensedAt,
        dispenserPractitionerProfileId: data.dispenserPractitionerProfileId,
        idempotencyKey: data.idempotencyKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `MedicationDispensationLines`.
   */
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
