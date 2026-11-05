import {
  FUNCTION_PROFILE_BY_CODE,
  PRACTICE_CONCEPT_BY_ID,
} from '../../practice/domain/structure/structure-catalog';
import { translateInfraWriteError } from '../../practice/services/ops/ops-errors';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DiagnosticEquipmentRepository } from '../repositories';
import {
  CreateEquipmentDto,
  EquipmentResponseDto,
  UpdateEquipmentDto,
} from '../dto';
import { DUNIT } from '../diagnostic_units.concepts';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';
import { EquipmentF5aService } from './equipment-f5a.service';

/**
 * Casos de uso de equipamiento y calibración del sitio (UC-23-09): registrar un
 * equipo y actualizar su estado/calibración. Registrar el primer equipo de imagen
 * marca `imaging_available` en el sitio.
 */
@Injectable()
export class DiagnosticEquipmentService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param scope - Resolvedor de recursos acotados al tenant activo.
   * @param equipmentRepo - Valor de equipment repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly scope: DiagnosticUnitScopeService,
    private readonly equipmentRepo: DiagnosticEquipmentRepository,
    private readonly logger: PinoLogger,
    // F5a: evaluador de §0.3 sobre la sede y eventos del equipo.
    private readonly f5a: EquipmentF5aService,
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
      const site = await this.scope.site(tx, siteId);
      if (site.statusConceptId !== DUNIT.SITE_ACTIVE) {
        throw new PreconditionFailedException('El sitio no está activo', {
          siteId,
        });
      }

      if (dto.serialNumber) {
        const clash = await this.equipmentRepo.findBySerial(
          tx,
          site.id,
          dto.serialNumber,
        );
        if (clash) {
          throw new ConflictException(
            'Ya existe un equipo con ese número de serie en el sitio',
            {
              serialNumber: dto.serialNumber,
            },
          );
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
    // Mantenimiento sólo cambia estado operativo y calibración (§F5a); sala,
    // DICOM y datos del equipo son de Admin org/sucursal.
    const statusOnly =
      dto.manufacturer === undefined &&
      dto.model === undefined &&
      dto.careSpaceId === undefined &&
      dto.aeTitle === undefined &&
      dto.stationName === undefined;
    return this.em.transactional(async (tx) => {
      const { equipment, home } = await this.f5a.authorize(
        tx,
        equipmentId,
        actor,
        statusOnly ? 'f5a.equipment.status' : 'f5a.equipment.write',
      );
      const before = {
        careSpaceId: equipment.careSpaceId ?? null,
        status: equipment.operationalStatusConceptId,
      };

      if (dto.manufacturer !== undefined)
        equipment.manufacturer = dto.manufacturer;
      if (dto.model !== undefined) equipment.model = dto.model;
      if (dto.lastCalibrationAt !== undefined)
        equipment.lastCalibrationAt = dto.lastCalibrationAt;
      if (dto.nextCalibrationDueAt !== undefined) {
        equipment.nextCalibrationDueAt = dto.nextCalibrationDueAt;
      }
      if (dto.operationalStatusConceptId !== undefined) {
        equipment.operationalStatusConceptId = dto.operationalStatusConceptId;
      }
      // F5a (CONTRATO-F2-F5 §F5a): sala del equipo y datos DICOM.
      if (dto.careSpaceId !== undefined) {
        if (dto.careSpaceId)
          await this.assertRoom(
            tx,
            equipment.diagnosticUnitSiteId,
            dto.careSpaceId,
          );
        await this.f5a.authorizeDestination(
          tx,
          actor,
          dto.careSpaceId || null,
          home?.practice_site_id ?? '',
        );
        equipment.careSpaceId = dto.careSpaceId || undefined;
      }
      if (dto.aeTitle !== undefined) {
        equipment.aeTitle = dto.aeTitle
          ? await this.assertAeTitle(
              tx,
              equipment.diagnosticUnitSiteId,
              equipment.id,
              dto.aeTitle,
            )
          : undefined;
      }
      if (dto.stationName !== undefined)
        equipment.stationName = dto.stationName ?? undefined;
      touch(equipment, actor.id);
      try {
        await tx.flush();
      } catch (error) {
        throw translateInfraWriteError(error);
      }
      await this.f5a.announceChanges(tx, equipment, before, actor.id);

      return {
        id: equipment.id,
        diagnosticUnitSiteId: equipment.diagnosticUnitSiteId,
        operationalStatus: equipment.operationalStatusConceptId,
        careSpaceId: equipment.careSpaceId ?? null,
        aeTitle: equipment.aeTitle ?? null,
        stationName: equipment.stationName ?? null,
      };
    });
  }

  /**
   * La sala del equipo: espacio del tenant activo (404), de la misma sede que
   * la sede de la unidad diagnóstica (422 `EQUIPMENT_SPACE_SITE_MISMATCH`) y
   * con función que aloja equipos (422 `SPACE_CANNOT_HOST_EQUIPMENT`).
   */
  private async assertRoom(
    tx: EntityManager,
    unitSiteId: string,
    careSpaceId: string,
  ): Promise<string> {
    const tenantId = requireTenantId();
    const [row] = await tx.execute<
      {
        practice_site_id: string;
        tenant_id: string;
        space_type_concept_id: string;
        unit_practice_site_id: string | null;
      }[]
    >(
      `SELECT c.practice_site_id, c.tenant_id, c.space_type_concept_id,
              (SELECT practice_site_id FROM diagnostic_units.diagnostic_unit_sites WHERE id = ?) AS unit_practice_site_id
         FROM practice.care_spaces c WHERE c.id = ?`,
      [unitSiteId, careSpaceId],
      'all',
    );
    if (!row || row.tenant_id !== tenantId) {
      throw new ResourceNotFoundException('Espacio no encontrado', {
        careSpaceId,
      });
    }
    if (row.practice_site_id !== row.unit_practice_site_id) {
      throw new PreconditionFailedException(
        'La sala es de otra sede',
        { careSpaceId },
        'EQUIPMENT_SPACE_SITE_MISMATCH',
      );
    }
    const code = PRACTICE_CONCEPT_BY_ID.get(row.space_type_concept_id)?.code;
    if (!code || !FUNCTION_PROFILE_BY_CODE.get(code)?.hostsEquipment) {
      throw new PreconditionFailedException(
        'El espacio no aloja equipos',
        { functionCode: code ?? null },
        'SPACE_CANNOT_HOST_EQUIPMENT',
      );
    }
    return careSpaceId;
  }

  /** DICOM AE Title válido (422 `AE_TITLE_INVALID`) y libre en la sede (409 `AE_TITLE_TAKEN`). */
  private async assertAeTitle(
    tx: EntityManager,
    unitSiteId: string,
    equipmentId: string,
    aeTitle: string,
  ): Promise<string> {
    if (
      !/^[\x20-\x7E]{1,16}$/.test(aeTitle) ||
      aeTitle.trim() === '' ||
      aeTitle.includes('\\')
    ) {
      throw new PreconditionFailedException(
        'AE Title inválido (≤ 16 caracteres ASCII, sin barra invertida)',
        {},
        'AE_TITLE_INVALID',
      );
    }
    const [taken] = await tx.execute<{ id: string }[]>(
      'SELECT id FROM diagnostic_units.diagnostic_equipment WHERE diagnostic_unit_site_id = ? AND ae_title = ? AND id <> ?',
      [unitSiteId, aeTitle, equipmentId],
      'all',
    );
    if (taken)
      throw new ConflictException(
        'El AE Title ya está en uso en la sede',
        {},
        'AE_TITLE_TAKEN',
      );
    return aeTitle;
  }
}
