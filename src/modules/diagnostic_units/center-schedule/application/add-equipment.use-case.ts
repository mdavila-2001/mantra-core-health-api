import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import { DUNIT } from '../../diagnostic_units.concepts';
import { DiagnosticUnitSites } from '../../entities';
import { DiagnosticEquipmentRepository } from '../../repositories';
import { MODALITY_CONCEPT } from '../domain/center-schedule.model';
import { equipmentType } from '../domain/equipment-types';
import { CenterBookingsRepository } from '../infrastructure/center-bookings.repository';
import { DeviceResourcesRepository } from '../infrastructure/device-resources.repository';
import type { CreateCenterDeviceDto } from '../presentation/dto/device.dto';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import { CenterContextService } from './center-context.service';
import { DeviceBookingsService } from './device-bookings.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

/**
 * `POST /diagnostic-units/:unitId/equipment`: the center inventories one of
 * its own devices from the catalog of types. It goes to the unit's main
 * active site, operational, following the general schedule until it gets its
 * own. The first imaging device marks the site as offering imaging, like the
 * platform-admin route does. A new operational line adopts the legacy
 * bookings it can attend.
 */
@Injectable()
export class AddEquipmentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly equipmentRepo: DiagnosticEquipmentRepository,
    private readonly devicesRepo: DeviceResourcesRepository,
    private readonly bookingsRepo: CenterBookingsRepository,
    private readonly context: CenterContextService,
    private readonly devices: DeviceBookingsService,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  execute(
    unitId: string,
    dto: CreateCenterDeviceDto,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const site = await this.devicesRepo.findMainSiteId(tx, unit.id);
      if (!site) {
        throw new PreconditionFailedException(
          'El centro no tiene una sede activa donde registrar equipos.',
          { unitId },
        );
      }
      const type = equipmentType(dto.typeCode);
      const serial = dto.serialNumber?.trim() || undefined;
      if (
        serial &&
        (await this.equipmentRepo.findBySerial(tx, site.id, serial))
      ) {
        throw new ConflictException(
          'Ya existe un equipo con ese número de serie en la sede.',
          { serialNumber: serial },
        );
      }
      this.equipmentRepo.create(tx, {
        diagnosticUnitSiteId: site.id,
        equipmentTypeConceptId: type.conceptId,
        manufacturer: dto.manufacturer?.trim() || undefined,
        model: dto.model?.trim() || undefined,
        serialNumber: serial,
        modalityConceptId: type.modalityCode
          ? MODALITY_CONCEPT[type.modalityCode]
          : undefined,
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        actorUserId: actor.id,
      });
      if (
        type.modalityCode &&
        type.modalityCode !== 'LAB' &&
        !site.imaging_available
      ) {
        const row = await tx.findOne(DiagnosticUnitSites, { id: site.id });
        if (row) row.imagingAvailable = true;
      }
      await tx.flush();
      const loaded = await this.context.load(tx, unit);
      if (loaded.resourceId) {
        await this.bookingsRepo.lockResource(tx, loaded.resourceId);
      }
      await this.devices.adoptLegacy(tx, loaded, actor.id);
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }
}
