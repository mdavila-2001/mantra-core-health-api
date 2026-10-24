import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { Geofences, TrackedSubjects } from '../entities';
import type {
  GeofenceItemDto,
  ListGeofencesQueryDto,
  ListTrackedSubjectsQueryDto,
  TrackedSubjectItemDto,
} from '../dto';

/**
 * Lecturas de colección de `geo`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class GeoCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar los sujetos rastreados del tenant (V13-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listTrackedSubjects(
    query: ListTrackedSubjectsQueryDto,
  ): Promise<PageResponseDto<TrackedSubjectItemDto>> {
    return listTenantCollection(this.em.fork(), TrackedSubjects, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        subjectId: query.subjectId,
        stateConceptId: query.stateConceptId,
      }),
      map: (row): TrackedSubjectItemDto => ({
        id: row.id,
        subjectTypeConceptId: row.subjectTypeConceptId,
        subjectId: row.subjectId,
        deviceId: row.deviceId ?? null,
        tenantId: row.tenantId ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las geocercas del tenant (V13-07).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listGeofences(
    query: ListGeofencesQueryDto,
  ): Promise<PageResponseDto<GeofenceItemDto>> {
    return listTenantCollection(this.em.fork(), Geofences, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): GeofenceItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        name: row.name,
        shapeTypeConceptId: row.shapeTypeConceptId,
        geometryJson: row.geometryJson ?? null,
        radiusM: row.radiusM ?? null,
        centerLat: row.centerLat ?? null,
        centerLng: row.centerLng ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
