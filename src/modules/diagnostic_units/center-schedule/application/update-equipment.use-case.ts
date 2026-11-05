import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import { DiagnosticEquipment, DiagnosticUnitSites } from '../../entities';
import { DiagnosticEquipmentRepository } from '../../repositories';
import { EquipmentF5aService } from '../../services/equipment-f5a.service';
import { EQUIPMENT_STATUS_CONCEPT } from '../domain/center-schedule.model';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import type { UpdateCenterDeviceDto } from '../presentation/dto/device.dto';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import { CenterContextService } from './center-context.service';
import { DeviceBookingsService } from './device-bookings.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

/**
 * `PATCH /diagnostic-units/:unitId/equipment/:equipmentId`: the device's
 * status and identifying data, by the center's own staff. Marking a device
 * down removes its line from the offer without touching any schedule; its
 * booked appointments are kept and surface as `bookingsWithoutEquipment`.
 * Putting one back in service lets it adopt legacy bookings. Emits the same
 * `equipment.status_changed` event as `PATCH /diagnostic-equipment/:id`.
 */
@Injectable()
export class UpdateEquipmentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly f5a: EquipmentF5aService,
    private readonly equipmentRepo: DiagnosticEquipmentRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly context: CenterContextService,
    private readonly devices: DeviceBookingsService,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  execute(
    unitId: string,
    equipmentId: string,
    dto: UpdateCenterDeviceDto,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const equipment = await this.ownEquipment(tx, unit.id, equipmentId);
      const before = {
        careSpaceId: equipment.careSpaceId ?? null,
        status: equipment.operationalStatusConceptId,
      };
      if (dto.status !== undefined) {
        equipment.operationalStatusConceptId =
          EQUIPMENT_STATUS_CONCEPT[dto.status];
      }
      if (dto.manufacturer !== undefined) {
        equipment.manufacturer = dto.manufacturer ?? undefined;
      }
      if (dto.model !== undefined) equipment.model = dto.model ?? undefined;
      if (dto.serialNumber !== undefined) {
        const serial = dto.serialNumber ?? undefined;
        const clash = serial
          ? await this.equipmentRepo.findBySerial(
              tx,
              equipment.diagnosticUnitSiteId,
              serial,
            )
          : null;
        if (clash && clash.id !== equipment.id) {
          throw new ConflictException(
            'Ya existe un equipo con ese número de serie en la sede.',
            { serialNumber: serial },
          );
        }
        equipment.serialNumber = serial;
      }
      touch(equipment, actor.id);
      await tx.flush();
      await this.f5a.announceChanges(tx, equipment, before, actor.id);
      const loaded = await this.context.load(tx, unit);
      if (loaded.resourceId) {
        await this.bookingsRepo.lockResource(tx, loaded.resourceId);
      }
      await this.devices.adoptLegacy(tx, loaded, actor.id);
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }

  /** A device of the unit; one of another unit answers like a missing one. */
  async ownEquipment(
    tx: EntityManager,
    unitId: string,
    equipmentId: string,
  ): Promise<DiagnosticEquipment> {
    const equipment = await tx.findOne(DiagnosticEquipment, {
      id: equipmentId,
    });
    const site = equipment
      ? await tx.findOne(DiagnosticUnitSites, {
          id: equipment.diagnosticUnitSiteId,
        })
      : null;
    if (!equipment || site?.diagnosticUnitId !== unitId) {
      throw new ResourceNotFoundException(
        'Equipo no encontrado',
        undefined,
        DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
      );
    }
    return equipment;
  }
}
