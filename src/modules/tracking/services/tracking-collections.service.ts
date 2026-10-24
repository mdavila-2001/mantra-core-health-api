import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  MilestoneDefinitions,
  Shipments,
  TrackableSubjects,
} from '../entities';
import type {
  ListMilestoneDefinitionsQueryDto,
  ListShipmentsQueryDto,
  ListTrackableSubjectsQueryDto,
  MilestoneDefinitionItemDto,
  ShipmentItemDto,
  TrackableSubjectItemDto,
} from '../dto';

/**
 * Lecturas de colección de `tracking`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class TrackingCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar envíos del tenant (V37-01).
   *
   * Sin `COURIER`: el transportista opera envíos sueltos por id; el listado del tenant es del operador logístico.
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listShipments(
    query: ListShipmentsQueryDto,
  ): Promise<PageResponseDto<ShipmentItemDto>> {
    return listTenantCollection(this.em.fork(), Shipments, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): ShipmentItemDto => ({
        id: row.id,
        trackableSubjectId: row.trackableSubjectId,
        carrierId: row.carrierId ?? null,
        tenantId: row.tenantId ?? null,
        shipmentNumber: row.shipmentNumber,
        originAddressId: row.originAddressId ?? null,
        destinationAddressId: row.destinationAddressId ?? null,
        assignedCourierUserId: row.assignedCourierUserId ?? null,
        trackedSubjectId: row.trackedSubjectId ?? null,
        statusConceptId: row.statusConceptId,
        dispatchedAt: row.dispatchedAt ?? null,
        estimatedArrivalAt: row.estimatedArrivalAt ?? null,
        deliveredAt: row.deliveredAt ?? null,
        distanceM: row.distanceM ?? null,
        temperatureControlled: row.temperatureControlled ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar definiciones de hito del tenant (V37-06).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listMilestoneDefinitions(
    query: ListMilestoneDefinitionsQueryDto,
  ): Promise<PageResponseDto<MilestoneDefinitionItemDto>> {
    return listTenantCollection(this.em.fork(), MilestoneDefinitions, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): MilestoneDefinitionItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        subjectTypeConceptId: row.subjectTypeConceptId,
        code: row.code,
        name: row.name,
        milestoneStatusConceptId: row.milestoneStatusConceptId,
        ordinal: row.ordinal ?? null,
        isTerminal: row.isTerminal ?? null,
        slaMinutes: row.slaMinutes ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar sujetos rastreables del tenant (V37-07).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listTrackableSubjects(
    query: ListTrackableSubjectsQueryDto,
  ): Promise<PageResponseDto<TrackableSubjectItemDto>> {
    return listTenantCollection(this.em.fork(), TrackableSubjects, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): TrackableSubjectItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        subjectTypeConceptId: row.subjectTypeConceptId,
        subjectRefType: row.subjectRefType,
        subjectRefId: row.subjectRefId,
        trackingNumber: row.trackingNumber,
        currentStatusConceptId: row.currentStatusConceptId ?? null,
        currentMilestoneId: row.currentMilestoneId ?? null,
        priorityConceptId: row.priorityConceptId ?? null,
        openedAt: row.openedAt ?? null,
        closedAt: row.closedAt ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
