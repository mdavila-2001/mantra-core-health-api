import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequests, DiagnosticReports } from '../../clinical/entities';
import { DiagnosticStudyOfferings } from '../../diagnostic_units/entities';
import { touch } from '../../../common';

/**
 * Lectura del circuito diagnóstico sobre las tablas del módulo clínico
 * (`clinical.service_requests` y `clinical.diagnostic_reports`).
 *
 * Vive en `diagnostics` y no en `clinical` porque la pregunta es de este
 * dominio —«¿qué le pedí a este paciente y qué volvió?»— y porque el módulo
 * clínico ya expone su propia cara de lectura para la suya. Es una clase sin
 * estado que recibe el `EntityManager` por parámetro, igual que
 * `AppointmentsRepository` en `scheduling`: proveerla acá no duplica ninguna
 * fuente de verdad ni obliga a importar el módulo clínico entero.
 *
 * **Casi no escribe.** El alta de una orden diagnóstica sigue siendo
 * `POST /clinical/service-requests`, que es donde viven sus invariantes. La
 * única escritura es {@link markReportReleased}: el puntero a la versión
 * liberada del informe, que es un efecto de liberar —operación de este módulo—
 * sobre una columna que vive en la tabla del otro.
 */
@Injectable()
export class DiagnosticOrdersRepository {
  /**
   * Órdenes de servicio del paciente acotadas a las categorías diagnósticas.
   *
   * El filtro por categoría es lo que hace que esto sea el circuito diagnóstico
   * y no «todas las órdenes»: una derivación a otra especialidad también es una
   * `service_request`, y mezclarla acá convertiría la pantalla de laboratorio en
   * una bandeja de todo.
   *
   * @param em - Contexto de persistencia.
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente cuyas órdenes se leen.
   * @param categoryConceptIds - Categorías consideradas diagnósticas.
   * @param limit - Tope de filas.
   * @returns Las órdenes, de la más nueva a la más vieja.
   */
  findOrdersByPatient(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    categoryConceptIds: readonly string[],
    limit: number,
  ): Promise<ServiceRequests[]> {
    return em.find(
      ServiceRequests,
      {
        custodianTenantId,
        patientProfileId,
        categoryConceptId: { $in: [...categoryConceptIds] },
      },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Informes diagnósticos del paciente.
   *
   * No se filtran por categoría: un informe ya cuelga del circuito diagnóstico
   * por definición —lo emite `POST /clinical/diagnostic-reports` desde una
   * orden—, y recortarlo por categoría escondería los que se emitieron sin
   * declararla.
   *
   * @param em - Contexto de persistencia.
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente cuyos informes se leen.
   * @param limit - Tope de filas.
   * @returns Los informes, del más nuevo al más viejo.
   */
  findReportsByPatient(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    limit: number,
  ): Promise<DiagnosticReports[]> {
    return em.find(
      DiagnosticReports,
      { custodianTenantId, patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Informes del paciente **sin acotar por tenant**.
   *
   * El portal del paciente no es el mostrador de una institución: alguien se
   * hace un análisis en un laboratorio y una radiografía en otro, y su lista de
   * resultados es una sola. Acotar por `custodian_tenant_id` —que es lo correcto
   * para la lectura del personal, y por eso {@link findReportsByPatient} lo
   * hace— le escondería la mitad de sus estudios según con qué organización
   * tenga sesión abierta.
   *
   * El aislamiento no se pierde: quien llama ya resolvió que el perfil es el de
   * la persona autenticada, y la visibilidad de cada informe la sigue decidiendo
   * su evento de liberación.
   *
   * @param em - Contexto de persistencia.
   * @param patientProfileId - Paciente cuyos informes se leen.
   * @param limit - Tope de filas.
   * @returns Los informes, del más nuevo al más viejo.
   */
  findReportsForPatientPortal(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<DiagnosticReports[]> {
    return em.find(
      DiagnosticReports,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Las órdenes diagnósticas del paciente, para su propio portal.
   *
   * Gemela de {@link findReportsForPatientPortal} y por la misma razón: la orden
   * que le dieron en una clínica y la que le dieron en otra son su lista, no la
   * de cada institución. Acotar por `custodian_tenant_id` —correcto en
   * {@link findOrdersByPatient}, que es la lectura del personal— le mostraría
   * sólo las del tenant con el que tenga sesión abierta.
   *
   * Sigue filtrando por categoría: `service_requests` también guarda
   * derivaciones e interconsultas, y el circuito diagnóstico es únicamente
   * laboratorio e imagenología.
   *
   * @param em - Contexto de persistencia.
   * @param patientProfileId - Paciente cuyas órdenes se leen.
   * @param categoryConceptIds - Categorías que definen el circuito diagnóstico.
   * @param limit - Tope de filas.
   * @returns Las órdenes, de la más nueva a la más vieja.
   */
  findOrdersForPatientPortal(
    em: EntityManager,
    patientProfileId: string,
    categoryConceptIds: readonly string[],
    limit: number,
  ): Promise<ServiceRequests[]> {
    return em.find(
      ServiceRequests,
      {
        patientProfileId,
        categoryConceptId: { $in: [...categoryConceptIds] },
      },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Los informes que cuelgan de un conjunto de órdenes.
   *
   * Se busca por orden y no por ventana de tiempo a propósito: preguntar «¿los
   * últimos N informes de esta persona incluyen el de esta orden?» convierte un
   * tope de paginado en una respuesta clínica, y una orden vieja aparecería
   * como «sin resultado» sólo porque su informe quedó fuera del recorte.
   *
   * @param em - Contexto de persistencia.
   * @param serviceRequestIds - Órdenes cuyas informes se buscan.
   * @returns Los informes de esas órdenes.
   */
  findReportsByServiceRequests(
    em: EntityManager,
    serviceRequestIds: readonly string[],
  ): Promise<DiagnosticReports[]> {
    if (serviceRequestIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(DiagnosticReports, {
      serviceRequestId: { $in: [...serviceRequestIds] },
    });
  }

  /**
   * La preparación publicada para un conjunto de estudios.
   *
   * El vínculo entre la orden y el catálogo es el **concepto**: la orden guarda
   * `code_concept_id` y la oferta guarda `study_concept_id`. No hay FK entre
   * ambas —la orden no elige centro— así que el emparejamiento es por concepto
   * y puede devolver varias filas para el mismo estudio, una por centro que lo
   * ofrece.
   *
   * Sólo trae las que tienen texto: una oferta sin preparación no aporta nada a
   * esta pregunta y filtrarla acá evita que quien llama tenga que hacerlo.
   *
   * @param em - Contexto de persistencia.
   * @param studyConceptIds - Conceptos de estudio a buscar.
   * @returns Las ofertas con preparación publicada.
   */
  findPreparationByStudyConcepts(
    em: EntityManager,
    studyConceptIds: readonly string[],
  ): Promise<DiagnosticStudyOfferings[]> {
    if (studyConceptIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(DiagnosticStudyOfferings, {
      studyConceptId: { $in: [...studyConceptIds] },
      preparationInstructions: { $ne: null },
    });
  }

  /**
   * Un informe concreto.
   *
   * @param em - Contexto de persistencia.
   * @param id - Informe buscado.
   * @returns El informe, o `null` si no existe.
   */
  findReportById(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticReports | null> {
    return em.findOne(DiagnosticReports, { id });
  }

  /**
   * Órdenes de servicio por id, en lote.
   *
   * Sirve para nombrar el estudio del que salió cada informe sin una consulta
   * por fila.
   *
   * @param em - Contexto de persistencia.
   * @param ids - Órdenes buscadas.
   * @returns Las órdenes encontradas.
   */
  findOrdersByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<ServiceRequests[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(ServiceRequests, { id: { $in: [...ids] } });
  }

  /**
   * Deja anotado en el informe cuál es su versión liberada.
   *
   * `clinical.diagnostic_reports` declara `current_released_version_id` y
   * `result_release_status_concept_id` desde siempre y **nadie las escribía**:
   * liberar una versión dejaba el evento de liberación y nada más, así que el
   * informe no sabía que se había liberado y la única forma de averiguarlo era
   * recorrer sus eventos. Se completa acá, dentro de la misma transacción que
   * libera, para que las dos cosas sean ciertas a la vez o ninguna.
   *
   * No sustituye al evento: el evento sigue siendo la fuente de verdad de la
   * **visibilidad del paciente** y el registro histórico de cada liberación.
   * Esto es el atajo de lectura.
   *
   * @param em - Transacción activa.
   * @param report - Informe a marcar.
   * @param releasedVersionId - Versión que acaba de liberarse.
   * @param patientVisibilityConceptId - Visibilidad con la que se liberó. Es lo
   *   que se guarda en `result_release_status_concept_id`: el estado de
   *   liberación que le importa a quien lee es si el paciente puede verlo.
   * @param actorUserId - Quién liberó.
   */
  markReportReleased(
    em: EntityManager,
    report: DiagnosticReports,
    releasedVersionId: string,
    patientVisibilityConceptId: string,
    actorUserId?: string,
  ): void {
    report.currentVersionId = releasedVersionId;
    report.currentReleasedVersionId = releasedVersionId;
    report.resultReleaseStatusConceptId = patientVisibilityConceptId;
    em.persist(touch(report, actorUserId));
  }
}
