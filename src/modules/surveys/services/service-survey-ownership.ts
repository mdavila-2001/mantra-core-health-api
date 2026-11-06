import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DomainException, ErrorCode } from '../../../common';
import {
  AssignmentsRepository,
  StandardTemplatesRepository,
  TargetsRepository,
} from '../repositories';
import type {
  SurveyAssignments,
  SurveyTemplates,
  SurveyVersions,
} from '../entities';
import { SURVEYS, isSystemOwnerType } from '../surveys.concepts';
import { SurveysErrorReason } from '../surveys.error-reasons';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import { isCatalogTemplate } from './invitation-candidates';

/** Si la emisión la manda: plantilla del catálogo estándar y activa. */
function isIssuable(owned: OwnedServiceAssignment): boolean {
  return (
    isCatalogTemplate(owned.template) &&
    owned.template.statusConceptId !== SURVEYS.TEMPLATE_INACTIVE
  );
}

/** Una asignación activa de servicio del profesional, con lo que la describe. */
export interface OwnedServiceAssignment {
  /** La asignación. */
  assignment: SurveyAssignments;
  /** Su versión. */
  version: SurveyVersions;
  /** Su plantilla (del profesional). */
  template: SurveyTemplates;
}

/** Un servicio del profesional: id y nombre del catálogo de facturación. */
export interface OwnedService {
  /** `billing.service_catalog.id`. */
  id: string;
  /** Nombre del servicio. */
  name: string;
}

/**
 * Qué servicios son del profesional y qué encuesta tiene asociada cada uno.
 *
 * «Sus servicios» son sus ofertas activas (`practitioner_service_offerings`,
 * `OFFERING_ACTIVE`) cuyo servicio es de una práctica del tenant activo. El
 * dueño de una asignación sale de su plantilla, que es la fuente de verdad (la
 * copia `owner_practitioner_id` la valida un disparador).
 */
@Injectable()
export class ServiceSurveyOwnership {
  constructor(
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly standardRepo: StandardTemplatesRepository,
    private readonly targetsRepo: TargetsRepository,
  ) {}

  /**
   * Exige que el servicio sea del profesional en el tenant. Si no, 403
   * uniforme: un servicio ajeno no se distingue de uno inexistente.
   *
   * @param lock - Bloquea sus ofertas (dentro de una transacción): serializa
   *   dos reemplazos simultáneos del mismo servicio.
   */
  async assertOwned(
    em: EntityManager,
    tenantId: string,
    practitionerProfileId: string,
    serviceId: string,
    lock = false,
  ): Promise<OwnedService> {
    const forbidden = () =>
      new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Ese servicio no es uno de sus servicios en esta organización',
        { serviceId },
        SurveysErrorReason.SERVICE_NOT_OWNED,
      );

    const offerings = lock
      ? await this.targetsRepo.lockOfferingsOf(
          em,
          practitionerProfileId,
          serviceId,
        )
      : await this.targetsRepo.listOfferingsOf(
          em,
          practitionerProfileId,
          SCHED.OFFERING_ACTIVE,
        );
    const offersIt = offerings.some(
      (o) =>
        o.serviceCatalogId === serviceId &&
        o.statusConceptId === SCHED.OFFERING_ACTIVE,
    );
    if (!offersIt) throw forbidden();

    const service = await this.targetsRepo.findServiceCatalog(em, serviceId);
    if (
      !service ||
      (await this.targetsRepo.findTenantOfPractice(em, service.practiceId)) !==
        tenantId
    ) {
      throw forbidden();
    }
    return { id: service.id, name: service.name };
  }

  /** Los servicios del profesional en el tenant, por nombre. */
  async listOwned(
    em: EntityManager,
    tenantId: string,
    practitionerProfileId: string,
  ): Promise<OwnedService[]> {
    const offerings = await this.targetsRepo.listOfferingsOf(
      em,
      practitionerProfileId,
      SCHED.OFFERING_ACTIVE,
    );
    const serviceIds = [...new Set(offerings.map((o) => o.serviceCatalogId))];
    const services = await this.targetsRepo.findServiceCatalogs(em, serviceIds);
    const tenants = await this.targetsRepo.findTenantsOfPractices(
      em,
      services.map((s) => s.practiceId),
    );
    return services
      .filter((s) => tenants.get(s.practiceId) === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((s) => ({ id: s.id, name: s.name }));
  }

  /**
   * La encuesta que de verdad sale para cada servicio del profesional: su
   * asignación activa más reciente de una plantilla **del catálogo** y activa.
   * Una asignación escrita a mano (anterior al catálogo) o de una plantilla
   * desactivada no cuenta, porque la emisión no la manda
   * (`SurveysAssignmentsService.issue`): el servicio usa la base de servicio y
   * se informa `assignment: null`. No se modifica ninguna fila.
   */
  async currentByService(
    em: EntityManager,
    tenantId: string,
    practitionerProfileId: string,
    serviceIds: readonly string[],
  ): Promise<Map<string, OwnedServiceAssignment>> {
    const result = new Map<string, OwnedServiceAssignment>();
    for (const owned of await this.listActive(
      em,
      tenantId,
      practitionerProfileId,
      serviceIds,
    )) {
      if (!isIssuable(owned)) continue;
      // La lista viene de la más reciente a la más antigua.
      if (!result.has(owned.assignment.targetId)) {
        result.set(owned.assignment.targetId, owned);
      }
    }
    return result;
  }

  /** Todas las asignaciones activas de servicio del profesional, más recientes primero. */
  async listActive(
    em: EntityManager,
    tenantId: string,
    practitionerProfileId: string,
    serviceIds: readonly string[],
  ): Promise<OwnedServiceAssignment[]> {
    const assignments = await this.assignmentsRepo.listActiveByTypeAndTargets(
      em,
      tenantId,
      SURVEYS.TARGET_SERVICE,
      serviceIds,
    );
    if (assignments.length === 0) return [];
    const versions = new Map(
      (
        await this.standardRepo.findVersionsByIds(
          em,
          assignments.map((a) => a.surveyVersionId),
        )
      ).map((v) => [v.id, v]),
    );
    const templates = new Map(
      (
        await this.standardRepo.findTemplatesByIds(
          em,
          [...versions.values()].map((v) => v.surveyTemplateId),
        )
      ).map((t) => [t.id, t]),
    );
    const owned: OwnedServiceAssignment[] = [];
    for (const assignment of assignments) {
      const version = versions.get(assignment.surveyVersionId);
      const template = version && templates.get(version.surveyTemplateId);
      if (!version || !template) continue;
      if (isSystemOwnerType(template.ownerTypeConceptId)) continue;
      if (template.ownerPractitionerId !== practitionerProfileId) continue;
      owned.push({ assignment, version, template });
    }
    return owned;
  }
}
