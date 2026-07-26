import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticEquipment } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de equipamiento de un sitio (UC-23-09). */
export interface CreateEquipmentData {
  diagnosticUnitSiteId: string;
  equipmentTypeConceptId: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  modalityConceptId?: string;
  lastCalibrationAt?: Date;
  nextCalibrationDueAt?: Date;
  operationalStatusConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_equipment`. */
@Injectable()
export class DiagnosticEquipmentRepository {
  findById(em: EntityManager, id: string): Promise<DiagnosticEquipment | null> {
    return em.findOne(DiagnosticEquipment, { id });
  }

  /** Equipo por (sitio, serial): la UK que evita duplicados. */
  findBySerial(
    em: EntityManager,
    diagnosticUnitSiteId: string,
    serialNumber: string,
  ): Promise<DiagnosticEquipment | null> {
    return em.findOne(DiagnosticEquipment, { diagnosticUnitSiteId, serialNumber });
  }

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
