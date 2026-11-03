import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type {
  MedicalCenterForOrdersQueryDto,
  MedicalCenterPageDto,
} from '../dto/medical-center-search.dto';
import {
  OwnServiceRequestsPort,
  PractitionerAffiliationsPort,
} from '../ports/medical-center.ports';
import {
  MedicalCentersSearchService,
  originOf,
} from './medical-centers-search.service';

/**
 * La búsqueda de centros para las órdenes de un paciente.
 *
 * Los procedimientos salen de las órdenes y no de la URL. Agrega a cada sede si
 * el médico de la orden trabaja ahí y si la sugirió, **sin** cambiar qué sedes
 * aparecen ni en qué orden: el mismo pedido da la misma lista con o sin
 * recomendación.
 */
@Injectable()
export class MedicalCentersForMyOrdersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param orders - Las órdenes del titular.
   * @param affiliations - Afiliaciones de los médicos.
   * @param search - La búsqueda por cobertura.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly orders: OwnServiceRequestsPort,
    private readonly affiliations: PractitionerAffiliationsPort,
    private readonly search: MedicalCentersSearchService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicalCentersForMyOrdersService.name);
  }

  /**
   * `GET /medical-centers/search/for-my-orders`.
   *
   * @param query - Órdenes pedidas y origen opcional.
   * @param actor - Paciente titular.
   * @returns Todas las sedes que cumplen, en el orden de la API.
   * @throws ResourceNotFoundException si alguna orden no es del titular o no existe.
   */
  async searchForOrders(
    query: MedicalCenterForOrdersQueryDto,
    actor: AuthenticatedUser,
  ): Promise<MedicalCenterPageDto> {
    const origin = originOf(query.lat, query.lng);
    const em = this.em.fork();
    const patientProfileId = await this.orders.resolveOwnPatientProfileId(
      em,
      actor,
    );
    const wanted = [...new Set(query.serviceRequestIds)];
    const owned = await this.orders.findOwned(em, patientProfileId, wanted);
    if (owned.length !== wanted.length) {
      // 404 y no 403: una orden ajena responde igual que una inexistente.
      throw new ResourceNotFoundException('Orden no encontrada');
    }

    this.logger.info(
      {
        operation: 'medical_centers.search_for_orders',
        ordenes: wanted.length,
      },
      'Buscando centros para las órdenes del titular',
    );

    const procedureConceptIds = [...new Set(owned.map((o) => o.codeConceptId))];
    const items = await this.search.searchAll(em, procedureConceptIds, {
      origin,
      includePartial: query.includePartial === 'true',
    });

    const practitionerIds = [
      ...new Set(
        owned
          .map((o) => o.requesterProfileId)
          .filter((id): id is string => id !== null),
      ),
    ];
    const works = new Set(
      (
        await this.affiliations.findActiveSites(
          em,
          practitionerIds,
          items.map((i) => i.practiceSiteId),
          procedureConceptIds,
        )
      ).map((pair) => pair.practiceSiteId),
    );
    const suggested = new Set(
      owned
        .map((o) => o.suggestedPracticeSiteId)
        .filter((id): id is string => id !== null),
    );

    return {
      items: items.map((item) => ({
        ...item,
        practitionerWorksHere: works.has(item.practiceSiteId),
        suggestedByPractitioner: suggested.has(item.practiceSiteId),
      })),
      total: items.length,
      limit: items.length,
      offset: 0,
    };
  }
}
