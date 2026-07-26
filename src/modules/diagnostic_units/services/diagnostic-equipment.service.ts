import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DiagnosticUnitSitesRepository,
  DiagnosticEquipmentRepository,
} from '../repositories';
import {
  CreateEquipmentDto,
  EquipmentResponseDto,
  UpdateEquipmentDto,
} from '../dto';
import { DUNIT } from '../diagnostic_units.concepts';

/**
 * Casos de uso de equipamiento y calibración del sitio (UC-23-09): registrar un
 * equipo y actualizar su estado/calibración. Registrar el primer equipo de imagen
 * marca `imaging_available` en el sitio.
 */
@Injectable()
export class DiagnosticEquipmentService {
  constructor(
    private readonly em: EntityManager,
    private readonly sitesRepo: DiagnosticUnitSitesRepository,
    private readonly equipmentRepo: DiagnosticEquipmentRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticEquipmentService.name);
  }

  /** UC-23-09: registrar equipamiento y calibración en un sitio activo. */
  async addEquipment(
    siteId: string,
    dto: CreateEquipmentDto,
    actor: AuthenticatedUser,
  ): Promise<EquipmentResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.equipment.add', siteId },
      'Registering equipment',
    );
    return this.em.transactional(async (tx) => {
      const site = await this.sitesRepo.findById(tx, siteId);
      if (!site) throw new ResourceNotFoundException('Sitio no encontrado', { siteId });
      if (site.statusConceptId !== DUNIT.SITE_ACTIVE) {
        throw new PreconditionFailedException('El sitio no está activo', { siteId });
      }

      if (dto.serialNumber) {
        const clash = await this.equipmentRepo.findBySerial(tx, site.id, dto.serialNumber);
        if (clash) {
          throw new ConflictException('Ya existe un equipo con ese número de serie en el sitio', {
            serialNumber: dto.serialNumber,
          });
        }
      }

      const equipment = this.equipmentRepo.create(tx, {
        diagnosticUnitSiteId: site.id,
        equipmentTypeConceptId: dto.equipmentTypeConceptId,
        manufacturer: dto.manufacturer,
        model: dto.model,
        serialNumber: dto.serialNumber,
        modalityConceptId: dto.modalityConceptId,
        lastCalibrationAt: dto.lastCalibrationAt,
        nextCalibrationDueAt: dto.nextCalibrationDueAt,
        operationalStatusConceptId: dto.operationalStatusConceptId,
        actorUserId: actor.id,
      });

      // Primer equipo con modalidad de imagen → habilita imaging en el sitio.
      if (dto.modalityConceptId && !site.imagingAvailable) {
        site.imagingAvailable = true;
        touch(site, actor.id);
      }

      return {
        id: equipment.id,
        diagnosticUnitSiteId: site.id,
        operationalStatus: equipment.operationalStatusConceptId,
      };
    });
  }

  /** UC-23-09: actualizar estado/calibración de un equipo. */
  async updateEquipment(
    equipmentId: string,
    dto: UpdateEquipmentDto,
    actor: AuthenticatedUser,
  ): Promise<EquipmentResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.equipment.update', equipmentId },
      'Updating equipment',
    );
    return this.em.transactional(async (tx) => {
      const equipment = await this.equipmentRepo.findById(tx, equipmentId);
      if (!equipment) {
        throw new ResourceNotFoundException('Equipo no encontrado', { equipmentId });
      }

      if (dto.manufacturer !== undefined) equipment.manufacturer = dto.manufacturer;
      if (dto.model !== undefined) equipment.model = dto.model;
      if (dto.lastCalibrationAt !== undefined) equipment.lastCalibrationAt = dto.lastCalibrationAt;
      if (dto.nextCalibrationDueAt !== undefined) {
        equipment.nextCalibrationDueAt = dto.nextCalibrationDueAt;
      }
      if (dto.operationalStatusConceptId !== undefined) {
        equipment.operationalStatusConceptId = dto.operationalStatusConceptId;
      }
      touch(equipment, actor.id);

      return {
        id: equipment.id,
        diagnosticUnitSiteId: equipment.diagnosticUnitSiteId,
        operationalStatus: equipment.operationalStatusConceptId,
      };
    });
  }
}
