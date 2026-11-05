import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ForeignKeyConstraintViolationException } from '@mikro-orm/core';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { DUNIT } from '../../diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import { DiagnosticEquipment, DiagnosticUnitSites } from '../../entities';
import {
  MODALITY_CONCEPT,
  type ModalityCode,
} from '../domain/center-schedule.model';
import type { CenterEquipmentInputDto } from '../presentation/dto/center-equipment.dto';
import type { CenterScheduleViewDto } from '../presentation/dto/center-schedule-view.dto';
import { CenterContextService } from './center-context.service';
import { GetCenterScheduleUseCase } from './get-center-schedule.use-case';

/**
 * The catalog types a device can be registered with. Mammography, densitometry
 * and CT are X-ray devices; MRI and sampling stations have no type in the
 * catalog yet, so they cannot be registered from here (422).
 */
const TYPE_OF_MODALITY: Readonly<Partial<Record<ModalityCode, string>>> = {
  ECO: DUNIT.EQUIPMENT_TYPE_ULTRASOUND,
  RX: DUNIT.EQUIPMENT_TYPE_XRAY,
  MG: DUNIT.EQUIPMENT_TYPE_XRAY,
  DXA: DUNIT.EQUIPMENT_TYPE_XRAY,
  TC: DUNIT.EQUIPMENT_TYPE_XRAY,
};

const OUT_OF_SCOPE =
  DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE;

const blank = (text: string | null | undefined): string | undefined =>
  text?.trim() || undefined;

/**
 * Register, edit and remove the devices (production lines) of a center from
 * «Horarios y equipos», for its own staff. A device without modality is an
 * analyzer: it processes samples in batches and never limits a slot.
 */
@Injectable()
export class ManageCenterEquipmentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly context: CenterContextService,
    private readonly reader: GetCenterScheduleUseCase,
  ) {}

  create(
    unitId: string,
    dto: CenterEquipmentInputDto,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const site = await tx.findOne(
        DiagnosticUnitSites,
        { diagnosticUnitId: unit.id, statusConceptId: DUNIT.SITE_ACTIVE },
        { orderBy: { createdAt: 'asc' } },
      );
      if (!site) {
        throw new PreconditionFailedException(
          'El centro no tiene una sucursal activa donde registrar el equipo.',
        );
      }
      tx.create(
        DiagnosticEquipment,
        {
          diagnosticUnitSiteId: site.id,
          ...this.identity(dto),
          operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
        },
        { partial: true },
      );
      // A device with an imaging modality enables imaging at the site.
      if (dto.modalityCode) {
        site.imagingAvailable = true;
        touch(site, actor.id);
      }
      await tx.flush();
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }

  update(
    unitId: string,
    equipmentId: string,
    dto: CenterEquipmentInputDto,
    actor: AuthenticatedUser,
  ): Promise<CenterScheduleViewDto> {
    return this.em.transactional(async (tx) => {
      const unit = await this.reader.staffUnit(tx, unitId);
      const equipment = await this.ownDevice(tx, unit.id, equipmentId);
      Object.assign(equipment, this.identity(dto));
      touch(equipment, actor.id);
      await tx.flush();
      return this.reader.view(tx, await this.context.load(tx, unit));
    });
  }

  /**
   * Removes a device registered by mistake. One already referenced by clinical
   * or imaging records cannot go: mark it out of service instead (409).
   */
  async remove(
    unitId: string,
    equipmentId: string,
  ): Promise<CenterScheduleViewDto> {
    try {
      return await this.em.transactional(async (tx) => {
        const unit = await this.reader.staffUnit(tx, unitId);
        const equipment = await this.ownDevice(tx, unit.id, equipmentId);
        tx.remove(equipment);
        await tx.flush();
        return this.reader.view(tx, await this.context.load(tx, unit));
      });
    } catch (error) {
      if (error instanceof ForeignKeyConstraintViolationException) {
        throw new ConflictException(
          'El equipo ya tiene registros asociados: márquelo «Fuera de servicio» en lugar de quitarlo.',
          { equipmentId },
        );
      }
      throw error;
    }
  }

  private identity(dto: CenterEquipmentInputDto) {
    const modality = dto.modalityCode ?? null;
    const type =
      modality === null
        ? DUNIT.EQUIPMENT_TYPE_ANALYZER
        : TYPE_OF_MODALITY[modality];
    if (type === undefined) {
      throw new PreconditionFailedException(
        'El catálogo todavía no tiene un tipo de equipo para esa modalidad.',
        { modalityCode: modality },
      );
    }
    return {
      equipmentTypeConceptId: type,
      model: dto.name.trim(),
      manufacturer: blank(dto.manufacturer) ?? (null as unknown as undefined),
      serialNumber: blank(dto.serialNumber) ?? (null as unknown as undefined),
      // `null` (not `undefined`) so an edit can clear it.
      modalityConceptId: (modality === null
        ? null
        : MODALITY_CONCEPT[modality]) as string | undefined,
    };
  }

  private async ownDevice(
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
        OUT_OF_SCOPE,
      );
    }
    return equipment;
  }
}
