import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticEquipment } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de equipamiento de un sitio (UC-23-09). */
export interface CreateEquipmentData {
  /**
   * Identificador asociado a diagnostic unit site.
   */
  diagnosticUnitSiteId: string;
  /**
   * Identificador asociado a equipment type concept.
   */
  equipmentTypeConceptId: string;
  /**
   * Valor de manufacturer mantenido por la instancia.
   */
  manufacturer?: string;
  /**
   * Valor de model mantenido por la instancia.
   */
  model?: string;
  /**
   * Valor de serial number mantenido por la instancia.
   */
  serialNumber?: string;
  /**
   * Identificador asociado a modality concept.
   */
  modalityConceptId?: string;
  /**
   * Valor de last calibration at mantenido por la instancia.
   */
  lastCalibrationAt?: Date;
  /**
   * Valor de next calibration due at mantenido por la instancia.
   */
  nextCalibrationDueAt?: Date;
  /**
   * Identificador asociado a operational status concept.
   */
  operationalStatusConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_equipment`. */
@Injectable()
export class DiagnosticEquipmentRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticEquipment | null>`.
   */
  findById(em: EntityManager, id: string): Promise<DiagnosticEquipment | null> {
    return em.findOne(DiagnosticEquipment, { id });
  }

  /** Equipo por (sitio, serial): la UK que evita duplicados. */
  findBySerial(
    em: EntityManager,
    diagnosticUnitSiteId: string,
    serialNumber: string,
  ): Promise<DiagnosticEquipment | null> {
    return em.findOne(DiagnosticEquipment, {
      diagnosticUnitSiteId,
      serialNumber,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticEquipment`.
   */
  create(em: EntityManager, data: CreateEquipmentData): DiagnosticEquipment {
    return em.create(
      DiagnosticEquipment,
      {
        diagnosticUnitSiteId: data.diagnosticUnitSiteId,
        equipmentTypeConceptId: data.equipmentTypeConceptId,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        modalityConceptId: data.modalityConceptId,
        lastCalibrationAt: data.lastCalibrationAt,
        nextCalibrationDueAt: data.nextCalibrationDueAt,
        operationalStatusConceptId:
          data.operationalStatusConceptId ?? DUNIT.EQUIPMENT_OPERATIONAL,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
