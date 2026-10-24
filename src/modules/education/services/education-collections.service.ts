import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { Courses } from '../entities';
import type { CourseItemDto, ListCoursesQueryDto } from '../dto';

/**
 * Lecturas de colección de `education`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class EducationCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar cursos del tenant (V47-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCourses(
    query: ListCoursesQueryDto,
  ): Promise<PageResponseDto<CourseItemDto>> {
    return listTenantCollection(this.em.fork(), Courses, {
      query,
      sortable: ['createdAt', 'updatedAt', 'code'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): CourseItemDto => ({
        id: row.id,
        tenantId: row.tenantId ?? null,
        code: row.code,
        title: row.title,
        description: row.description ?? null,
        courseTypeConceptId: row.courseTypeConceptId,
        specialtyConceptId: row.specialtyConceptId ?? null,
        levelConceptId: row.levelConceptId ?? null,
        languageConceptId: row.languageConceptId ?? null,
        coverFileId: row.coverFileId ?? null,
        isAccredited: row.isAccredited ?? null,
        cmeCreditHours: row.cmeCreditHours ?? null,
        accreditingBodyConceptId: row.accreditingBodyConceptId ?? null,
        price: row.price ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        durationMinutes: row.durationMinutes ?? null,
        currentVersion: row.currentVersion,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
