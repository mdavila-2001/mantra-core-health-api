import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  roleAuthorizesInTenant,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services/outbox.service';
import {
  FUNCTIONS,
  FUNCTION_PROFILES,
  type FunctionCode,
} from '../../practice/infrastructure-catalog';
import { PRAC } from '../../practice/practice.concepts';
import { OpsErrorReason } from '../../practice/practice-ops.error-reasons';
import { InfrastructureAccessService } from '../../practice/services/infrastructure-access.service';
import { OpsStateService } from '../../practice/services/ops-state';
import { DiagnosticEquipmentRepository } from '../repositories';
import {
  CreateEquipmentDto,
  EquipmentResponseDto,
  LinkEquipmentResourceDto,
  MwlStationDto,
  UpdateEquipmentDto,
} from '../dto';
import { DUNIT } from '../diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from '../diagnostic_units.error-reasons';
import {
  assertEquipmentStatus,
  isOutOfService,
  normalizeAeTitle,
  normalizeStationName,
} from '../diagnostic-equipment-rules';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';
import {
  EquipmentAgendaRegistry,
  type EquipmentCommitment,
} from './equipment-agenda.port';

/** `diagnostic_units.equipment.located`: el equipo se ubicó, cambió de sala o se desubicó. */
export const EQUIPMENT_LOCATED_EVENT = 'diagnostic_units.equipment.located';
/** `diagnostic_units.equipment.status_changed`: el estado operativo del equipo cambió. */
export const EQUIPMENT_STATUS_CHANGED_EVENT =
  'diagnostic_units.equipment.status_changed';

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
    private readonly infra: InfrastructureAccessService,
    private readonly state: OpsStateService,
    private readonly outbox: OutboxService,
    private readonly agendaRegistry: EquipmentAgendaRegistry,
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

  /**
   * UC-23-09 + F5a: actualiza el equipo: estado y calibración, y desde F5a su sala, su AE Title
   * y el nombre de su estación DICOM.
   *
   * Quién puede (la API decide; la interfaz sólo refleja):
   *
   * - la plataforma (`SECURITY_ADMIN`) todo, como hasta ahora;
   * - el administrador de la organización o de la sucursal de la sala, todo;
   * - Mantenimiento, **sólo** el estado operativo y la calibración.
   *
   * Un equipo de otra organización responde 404 uniforme; uno que el actor ve pero no puede
   * tocar, 403 `INFRA_ACTION_NOT_ALLOWED`.
   *
   * Reglas de la ubicación: la sala es del tenant (404), de la misma sede que el sitio del
   * equipo (422 `EQUIPMENT_SPACE_SITE_MISMATCH`), está activa (422 `EQUIPMENT_SPACE_NOT_ACTIVE`)
   * y su función aloja equipos —sala de imagen para una modalidad— (422
   * `SPACE_CANNOT_HOST_EQUIPMENT`). El AE Title cumple DICOM (422 `AE_TITLE_INVALID`) y no lo
   * usa otro equipo del sitio (409 `AE_TITLE_TAKEN`; el único de la base es la red).
   *
   * Mover el equipo de sala mueve con él sus pasos de imagen ya programados y las citas
   * futuras de su agenda, en la misma transacción: si la sala nueva no puede recibirlas (422
   * bloqueada, 409 ocupada), no se mueve nada. Sacarlo de servicio con reservas futuras es 409
   * `FUTURE_COMMITMENTS_CONFLICT` con la lista y su próxima acción, salvo que se reconozcan
   * (`acknowledgeConflicts`); la agenda cierra entonces sus cupos y los reabre al volver.
   */
  async updateEquipment(
    equipmentId: string,
    dto: UpdateEquipmentDto,
    actor: AuthenticatedUser,
  ): Promise<EquipmentResponseDto> {
    this.logger.info(
      { operation: 'diagnostic_units.equipment.update', equipmentId },
      'Updating equipment',
    );
    // Errores de forma del cliente: antes de abrir la transacción.
    const aeTitle =
      dto.aeTitle === undefined ? undefined : normalizeAeTitle(dto.aeTitle);
    const stationName =
      dto.stationName === undefined
        ? undefined
        : normalizeStationName(dto.stationName);
    if (dto.operationalStatusConceptId !== undefined) {
      assertEquipmentStatus(dto.operationalStatusConceptId);
    }
    const tenantId = requireTenantId();

    return this.em.transactional(async (tx) => {
      const found = await this.scope.equipment(tx, equipmentId);
      // Serializa las ediciones del mismo equipo: ubicar, sacar de servicio y reservar no se pisan.
      await tx.execute(
        `select 1 from diagnostic_units.diagnostic_equipment where id = ? for update`,
        [equipmentId],
      );
      await tx.refresh(found);
      const equipment = found;
      const site = await this.scope.site(tx, equipment.diagnosticUnitSiteId);

      await this.authorizeUpdate(
        tx,
        actor,
        tenantId,
        equipment,
        site.practiceSiteId,
        dto,
      );

      const previousSpaceId = equipment.careSpaceId ?? null;
      const previousStatus = equipment.operationalStatusConceptId;
      const now = new Date();

      // --- ubicación ---------------------------------------------------------
      let nextSpaceId: string | null | undefined;
      if (
        dto.careSpaceId !== undefined &&
        dto.careSpaceId !== previousSpaceId
      ) {
        nextSpaceId = dto.careSpaceId;
        if (nextSpaceId !== null) {
          await this.assertCanHost(
            tx,
            tenantId,
            nextSpaceId,
            site.practiceSiteId,
            equipment.modalityConceptId !== undefined &&
              equipment.modalityConceptId !== null,
          );
        }
      }

      // --- AE Title: el pre-chequeo da el 409; el único de la base es la red ---
      if (
        aeTitle !== undefined &&
        aeTitle !== null &&
        aeTitle !== equipment.aeTitle
      ) {
        const clash = await tx.execute<{ id: string }[]>(
          `select id from diagnostic_units.diagnostic_equipment
            where diagnostic_unit_site_id = ? and ae_title = ? and id <> ? limit 1`,
          [equipment.diagnosticUnitSiteId, aeTitle, equipmentId],
        );
        if (clash.length > 0) this.aeTitleTaken();
      }

      // --- estado: sacar de servicio con reservas futuras --------------------
      const statusChanged =
        dto.operationalStatusConceptId !== undefined &&
        dto.operationalStatusConceptId !== previousStatus;
      const goingOut =
        statusChanged && isOutOfService(dto.operationalStatusConceptId!);
      const agenda = this.agendaRegistry.get();
      let conflicts: EquipmentCommitment[] = [];
      if ((goingOut || nextSpaceId === null) && agenda) {
        conflicts = await agenda.futureCommitments(tx, equipmentId, now);
      }
      if (nextSpaceId === null && conflicts.length > 0) {
        // Desubicar un equipo con reservas las dejaría sin sala: no hay reconocimiento que valga.
        this.commitmentsConflict(conflicts);
      }
      if (
        goingOut &&
        conflicts.length > 0 &&
        dto.acknowledgeConflicts !== true
      ) {
        this.commitmentsConflict(conflicts);
      }

      // --- escribir ----------------------------------------------------------
      if (dto.manufacturer !== undefined)
        equipment.manufacturer = dto.manufacturer;
      if (dto.model !== undefined) equipment.model = dto.model;
      if (dto.lastCalibrationAt !== undefined)
        equipment.lastCalibrationAt = dto.lastCalibrationAt;
      if (dto.nextCalibrationDueAt !== undefined) {
        equipment.nextCalibrationDueAt = dto.nextCalibrationDueAt;
      }
      if (statusChanged) {
        equipment.operationalStatusConceptId = dto.operationalStatusConceptId!;
      }
      // Columnas anulables: quitar un valor es escribir NULL, no dejar el campo sin tocar.
      const nullable = equipment as unknown as Record<
        string,
        string | null | undefined
      >;
      if (nextSpaceId !== undefined) nullable.careSpaceId = nextSpaceId;
      if (aeTitle !== undefined) nullable.aeTitle = aeTitle;
      if (stationName !== undefined) nullable.stationName = stationName;
      touch(equipment, actor.id);
      try {
        await tx.flush();
      } catch (error) {
        if (
          error instanceof UniqueConstraintViolationException &&
          (error as { constraint?: string }).constraint ===
            'ux_diagnostic_equipment_site_ae_title'
        ) {
          this.aeTitleTaken();
        }
        throw error;
      }

      // --- lo que cuelga del equipo ------------------------------------------
      if (nextSpaceId !== undefined) {
        await this.moveScheduledSteps(tx, equipmentId, nextSpaceId, now);
        await agenda?.relocateBookings(tx, {
          equipmentId,
          tenantId,
          careSpaceId: nextSpaceId,
          actorUserId: actor.id,
          now,
        });
        await this.outbox.publishDomainEvent(tx, {
          tenantId,
          eventType: EQUIPMENT_LOCATED_EVENT,
          aggregateType: 'diagnostic_equipment',
          aggregateId: equipmentId,
          payloadJson: {
            equipmentId,
            siteId: site.practiceSiteId,
            careSpaceId: nextSpaceId,
            previousCareSpaceId: previousSpaceId,
            aeTitle: equipment.aeTitle ?? null,
            tenantId,
            actorUserId: actor.id,
            occurredAt: now.toISOString(),
          },
          actorUserId: actor.id,
        });
      }
      if (statusChanged) {
        await agenda?.syncStatus(tx, {
          equipmentId,
          tenantId,
          outOfService: isOutOfService(equipment.operationalStatusConceptId),
          actorUserId: actor.id,
          now,
        });
        await this.outbox.publishDomainEvent(tx, {
          tenantId,
          eventType: EQUIPMENT_STATUS_CHANGED_EVENT,
          aggregateType: 'diagnostic_equipment',
          aggregateId: equipmentId,
          payloadJson: {
            equipmentId,
            siteId: site.practiceSiteId,
            careSpaceId: equipment.careSpaceId ?? null,
            from: previousStatus,
            to: equipment.operationalStatusConceptId,
            outOfService: isOutOfService(equipment.operationalStatusConceptId),
            futureCommitments: conflicts.length,
            tenantId,
            actorUserId: actor.id,
            occurredAt: now.toISOString(),
          },
          actorUserId: actor.id,
        });
      }

      return {
        ...this.toResponse(equipment, site.id),
        ...(goingOut && conflicts.length > 0 ? { conflicts } : {}),
      };
    });
  }

  /**
   * F5a: crea el recurso agendable `EQUIPMENT` del equipo, atado a su sala.
   *
   * @throws ResourceNotFoundException (404 uniforme) si el equipo no es del tenant.
   * @throws PreconditionFailedException (422 `EQUIPMENT_NOT_LOCATED`) si no está en una sala.
   * @throws ConflictException (409 `RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT`).
   */
  async linkResource(
    equipmentId: string,
    dto: LinkEquipmentResourceDto,
    actor: AuthenticatedUser,
  ): Promise<{ id: string; name: string; stateConceptId: string }> {
    this.logger.info(
      { operation: 'diagnostic_units.equipment.link_resource', equipmentId },
      'Linking equipment to the agenda',
    );
    const agenda = this.agendaRegistry.get();
    if (!agenda) {
      throw new PreconditionFailedException(
        'La agenda del equipo no está disponible',
        undefined,
        DiagnosticUnitsErrorReason.EQUIPMENT_AGENDA_UNAVAILABLE,
      );
    }
    return this.em.transactional(async (tx) => {
      // 404 uniforme antes de cualquier otra cosa.
      await this.scope.equipment(tx, equipmentId);
      return agenda.linkResource(tx, equipmentId, dto, actor);
    });
  }

  /**
   * F5a: la estación DICOM del equipo para la Modality Worklist:
   * `{scheduledStationAETitle (0040,0001), scheduledStationName (0040,0010), spsLocation
   * (0040,0011) = código de la sala}`. No lleva datos de paciente.
   *
   * Lo ve quien atiende la clínica o la agenda del tenant, y quien administra o mantiene el
   * espacio del equipo.
   */
  async mwlStation(
    equipmentId: string,
    actor: AuthenticatedUser,
  ): Promise<MwlStationDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const equipment = await this.scope.equipment(tx, equipmentId);
      const readers = [
        'SECURITY_ADMIN',
        'CLINICIAN',
        'PRACTITIONER',
        'SCHEDULING_ADMIN',
        'SCHEDULING_AGENT',
      ];
      if (
        !readers.some((role) => roleAuthorizesInTenant(actor, role, tenantId))
      ) {
        const site = await this.scope.site(tx, equipment.diagnosticUnitSiteId);
        await this.infra.assertCan(
          actor,
          'infra.equipment.view',
          equipment.careSpaceId
            ? { careSpaceId: equipment.careSpaceId }
            : { siteId: site.practiceSiteId },
          tx,
        );
      }
      let spsLocation: string | null = null;
      if (equipment.careSpaceId) {
        const space = await this.state.loadSpace(
          tx,
          tenantId,
          equipment.careSpaceId,
        );
        spsLocation = space.code;
      }
      return {
        equipmentId,
        scheduledStationAETitle: equipment.aeTitle ?? null,
        scheduledStationName: equipment.stationName ?? null,
        spsLocation,
        careSpaceId: equipment.careSpaceId ?? null,
      };
    });
  }

  // ------------------------------------------------------------ auxiliares

  /** La respuesta del equipo tal como quedó. */
  private toResponse(
    equipment: {
      id: string;
      operationalStatusConceptId: string;
      careSpaceId?: string | null;
      aeTitle?: string | null;
      stationName?: string | null;
    },
    siteId: string,
  ): EquipmentResponseDto {
    return {
      id: equipment.id,
      diagnosticUnitSiteId: siteId,
      operationalStatus: equipment.operationalStatusConceptId,
      ...(equipment.careSpaceId ? { careSpaceId: equipment.careSpaceId } : {}),
      ...(equipment.aeTitle ? { aeTitle: equipment.aeTitle } : {}),
      ...(equipment.stationName ? { stationName: equipment.stationName } : {}),
    };
  }

  /**
   * Quién puede qué sobre este equipo. La plataforma todo; los demás, por la política del
   * espacio del equipo (o de su sede si no está ubicado), y para ubicarlo en una sala nueva
   * también sobre la sala de destino. Lo estructural (sala, AE Title, estación, datos) exige
   * `infra.equipment.edit`; el estado y la calibración, `infra.equipment.status`.
   */
  private async authorizeUpdate(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    equipment: { careSpaceId?: string | null },
    practiceSiteId: string,
    dto: UpdateEquipmentDto,
  ): Promise<void> {
    if (roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId)) return;
    const structural =
      dto.careSpaceId !== undefined ||
      dto.aeTitle !== undefined ||
      dto.stationName !== undefined ||
      dto.manufacturer !== undefined ||
      dto.model !== undefined;
    const operational =
      dto.operationalStatusConceptId !== undefined ||
      dto.lastCalibrationAt !== undefined ||
      dto.nextCalibrationDueAt !== undefined;
    const target = equipment.careSpaceId
      ? { careSpaceId: equipment.careSpaceId }
      : { siteId: practiceSiteId };
    if (structural) {
      await this.infra.assertCan(actor, 'infra.equipment.edit', target, tx);
    }
    if (operational) {
      await this.infra.assertCan(actor, 'infra.equipment.status', target, tx);
    }
    if (!structural && !operational) {
      // Un cuerpo vacío no cambia nada, pero tampoco se le responde a quien no ve el equipo.
      await this.infra.assertCan(actor, 'infra.equipment.view', target, tx);
    }
    if (
      dto.careSpaceId !== undefined &&
      dto.careSpaceId !== null &&
      dto.careSpaceId !== equipment.careSpaceId
    ) {
      await this.infra.assertCan(
        actor,
        'infra.equipment.edit',
        { careSpaceId: dto.careSpaceId },
        tx,
      );
    }
  }

  /**
   * La sala puede alojar el equipo: es del tenant (404), de la misma sede (422), está activa
   * (422) y su función aloja equipos —sala de imagen si el equipo tiene modalidad— (422). Se
   * bloquea la fila `FOR SHARE`: una clausura concurrente (que toma `FOR UPDATE` y cuenta los
   * equipos) o ve el equipo, o esta ubicación ve la sala clausurada.
   */
  private async assertCanHost(
    tx: EntityManager,
    tenantId: string,
    careSpaceId: string,
    practiceSiteId: string,
    hasModality: boolean,
  ): Promise<void> {
    const space = await this.state.loadSpace(tx, tenantId, careSpaceId);
    await tx.execute(
      `select 1 from practice.care_spaces where id = ? and tenant_id = ? for share`,
      [careSpaceId, tenantId],
    );
    if (space.practiceSiteId !== practiceSiteId) {
      throw new PreconditionFailedException(
        'La sala no es de la misma sede que el equipo',
        { careSpaceId },
        DiagnosticUnitsErrorReason.EQUIPMENT_SPACE_SITE_MISMATCH,
      );
    }
    const fn = FUNCTIONS.byConceptId(space.spaceTypeConceptId)?.code as
      FunctionCode | undefined;
    const hosts = fn ? FUNCTION_PROFILES[fn].hostsEquipment : false;
    if (!hosts || (hasModality && fn !== 'SPACE_FN_IMAGING_ROOM')) {
      throw new PreconditionFailedException(
        hasModality
          ? 'Una modalidad de imagen se ubica en una sala de imagen'
          : 'La función de la sala no aloja equipos',
        { careSpaceId, function: fn ?? null },
        DiagnosticUnitsErrorReason.SPACE_CANNOT_HOST_EQUIPMENT,
      );
    }
    if (space.statusConceptId !== PRAC.SPACE_ACTIVE) {
      throw new PreconditionFailedException(
        'Sólo una sala activa aloja equipos',
        { careSpaceId },
        DiagnosticUnitsErrorReason.EQUIPMENT_SPACE_NOT_ACTIVE,
      );
    }
  }

  /**
   * Los pasos de imagen ya programados en este equipo (y todavía por delante) pasan a la sala
   * nueva. La base sólo revalida la sala de un paso cuando se escriben sus columnas
   * `scheduled_*`; si el equipo se reubica, lo hace esta llamada. Un equipo desubicado deja los
   * pasos sin sala (el CHECK exige el equipo para la sala, no al revés).
   */
  private async moveScheduledSteps(
    tx: EntityManager,
    equipmentId: string,
    careSpaceId: string | null,
    now: Date,
  ): Promise<void> {
    await tx.execute(
      `update diagnostics.imaging_procedure_steps
          set scheduled_care_space_id = ?, updated_at = ?, row_version = row_version + 1
        where scheduled_equipment_id = ? and scheduled_start_at > ?`,
      [careSpaceId, now, equipmentId, now],
    );
  }

  /** 409 `AE_TITLE_TAKEN` (sin decir de quién es el título repetido). */
  private aeTitleTaken(): never {
    throw new ConflictException(
      'Otro equipo del sitio ya usa ese AE Title',
      undefined,
      DiagnosticUnitsErrorReason.AE_TITLE_TAKEN,
    );
  }

  /** 409 `FUTURE_COMMITMENTS_CONFLICT` con la lista y la próxima acción de cada una. */
  private commitmentsConflict(conflicts: EquipmentCommitment[]): never {
    throw new ConflictException(
      'El equipo tiene reservas futuras: reprogramelas o reconozca el conflicto',
      { conflicts },
      OpsErrorReason.FUTURE_COMMITMENTS_CONFLICT,
    );
  }
}
