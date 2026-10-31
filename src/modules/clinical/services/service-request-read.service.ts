import { HttpException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ServiceRequests } from '../entities';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import { DEFAULT_PERFORMER_SELECTION_CONCEPT } from '../performer-selection';
import { analysisCategoryOf } from '../service-request-category';
import { CLIN } from '../clinical.concepts';
import type { ServiceRequestResponseDto } from '../dto';
import { ClinicalReadService } from './clinical-read.service';
import { ServiceRequestDetailService } from './service-request-detail.service';
import { ServiceRequestNotesService } from './service-request-notes.service';
import { SuggestedSiteNamesReader } from './suggested-site-names.reader';

/**
 * C5: lectura de una orden de servicio por su custodio, con el detalle
 * completo (muestra, componentes, imagen). Es también el armado de la
 * respuesta que comparten el alta, la requisición y su repetición idempotente.
 */
@Injectable()
export class ServiceRequestReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly clinicalRead: ClinicalReadService,
    private readonly detail: ServiceRequestDetailService,
    private readonly notes: ServiceRequestNotesService,
    private readonly siteNames: SuggestedSiteNamesReader,
  ) {}

  /**
   * `GET /clinical/service-requests/:id`.
   *
   * El guard del expediente sólo mira `params.patientProfileId`, y esta ruta
   * lleva el id de la orden: el paciente sale de la orden cargada y se autoriza
   * acá. Una orden de otro tenant, inexistente o de un paciente sobre el que el
   * actor no tiene relación responde igual: 404 (no se distingue).
   */
  async getById(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<ServiceRequestResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const sr = await em.findOne(ServiceRequests, { id });
    if (!sr || sr.custodianTenantId !== tenantId) throw this.notFound(id);
    try {
      await this.clinicalRead.assertCanReadHistory(sr.patientProfileId, actor);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 403) {
        throw this.notFound(id);
      }
      throw error;
    }
    const [response] = await this.toResponses(em, [sr]);
    return response;
  }

  /** Las respuestas de varias órdenes, en el orden dado. */
  async toResponses(
    em: EntityManager,
    requests: readonly ServiceRequests[],
  ): Promise<ServiceRequestResponseDto[]> {
    const [details, noteIds, names] = await Promise.all([
      this.detail.describe(em, requests),
      this.notes.noteIdsFor(
        em,
        requests.map((r) => r.id),
      ),
      this.siteNames.namesFor(
        em,
        requests.map((r) => r.suggestedPracticeSiteId),
      ),
    ]);
    return requests.map((sr) => {
      const view = details.get(sr.id);
      return {
        id: sr.id,
        patientProfileId: sr.patientProfileId,
        formInstanceId: sr.formInstanceId ?? null,
        requisitionId: sr.requisitionId ?? null,
        codeConceptId: sr.codeConceptId,
        codeDisplay: view?.codeDisplay,
        specimenTypeConceptId: sr.specimenTypeConceptId ?? null,
        specimenTypeDisplay: view?.specimenTypeDisplay ?? null,
        components: view?.components ?? [],
        componentsSpecified: view?.componentsSpecified ?? false,
        imaging: view?.imaging ?? null,
        category: analysisCategoryOf(sr.categoryConceptId),
        basedOnNoteIds: noteIds.get(sr.id) ?? [],
        status: sr.statusConceptId,
        intent: sr.intentConceptId ?? CLIN.SERVICE_REQUEST_INTENT_ORDER,
        performerSelectionConceptId:
          sr.performerSelectionConceptId ?? DEFAULT_PERFORMER_SELECTION_CONCEPT,
        performerPractitionerProfileId:
          sr.performerPractitionerProfileId ?? null,
        suggestedPracticeSiteId: sr.suggestedPracticeSiteId ?? null,
        suggestedPracticeSiteName: sr.suggestedPracticeSiteId
          ? (names.get(sr.suggestedPracticeSiteId) ?? null)
          : null,
        createdAt: sr.createdAt,
      };
    });
  }

  private notFound(id: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Orden de servicio no encontrada',
      { serviceRequestId: id },
      ClinicalErrorReason.SERVICE_REQUEST_NOT_FOUND,
    );
  }
}
