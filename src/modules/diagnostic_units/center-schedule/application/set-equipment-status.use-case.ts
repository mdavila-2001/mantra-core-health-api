import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import { DiagnosticEquipment, DiagnosticUnitSites } from '../../entities';
import { EquipmentF5aService } from '../../services/equipment-f5a.service';
import {
  EQUIPMENT_STATUS_CONCEPT,
  type EquipmentStatus,
} from '../domain/center-schedule.model';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import { CenterContextService } from './center-context.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

/**
 * `PATCH /diagnostic-units/:unitId/equipment/:equipmentId`: operational or
 * not. Marking a device down lowers the modality's quota without touching the
 * schedule; booked appointments are kept and surface as
 * `bookingsWithoutEquipment`. Emits the same `equipment.status_changed` event
 * as `PATCH /diagnostic-equipment/:id`.
 */
@Injectable()
export class SetEquipmentStatusUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly f5a: EquipmentF5aService,
    private readonly context: CenterContextService,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  execute(
    unitId: string,
    equipmentId: string,
    status: EquipmentStatus,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const equipment = await tx.findOne(DiagnosticEquipment, {
        id: equipmentId,
      });
      const site = equipment
        ? await tx.findOne(DiagnosticUnitSites, {
            id: equipment.diagnosticUnitSiteId,
          })
        : null;
      if (!equipment || site?.diagnosticUnitId !== unit.id) {
        throw new ResourceNotFoundException(
          'Equipo no encontrado',
          undefined,
          DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
        );
      }
      const before = {
        careSpaceId: equipment.careSpaceId ?? null,
        status: equipment.operationalStatusConceptId,
      };
      equipment.operationalStatusConceptId = EQUIPMENT_STATUS_CONCEPT[status];
      touch(equipment, actor.id);
      await tx.flush();
      await this.f5a.announceChanges(tx, equipment, before, actor.id);
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }
}
