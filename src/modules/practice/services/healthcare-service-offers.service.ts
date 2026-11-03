import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { ServiceCatalogRepository } from '../../billing/repositories';
import { ProcedureReferenceReader } from '../../billing/services/procedure-reference.reader';
import { CatalogConcepts } from '../../terminology/entities';
import type { HealthcareServices } from '../entities';
import { PRAC } from '../practice.concepts';
import { HealthcareServicesRepository } from '../repositories';
import type {
  HealthcareServiceOfferDto,
  HealthcareServiceOffersResponseDto,
} from '../dto/healthcare-service-offer.dto';
import type { UpdateHealthcareServiceDto } from '../dto/update-healthcare-service.dto';
import { assertCatalogItemFits } from './healthcare-service-catalog-item';
import { PracticeAdministrationService } from './practice-administration.service';
import { practiceOutOfScope } from './practice-scope';

/**
 * Lo que una sede ofrece del nomenclador, con su precio y su referencia.
 *
 * El precio sale del ítem de `billing.service_catalog` al que apunta cada
 * servicio (el que se factura); la referencia, del nomenclador. `overMargin` es
 * siempre `null`: el margen del aviso de sobreprecio todavía no está fijado, así
 * que ninguna oferta se marca por encima de la referencia.
 */
@Injectable()
export class HealthcareServiceOffersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param administration - Regla de administración por organización (A-6).
   * @param servicesRepo - Servicios de salud de las sedes.
   * @param catalogRepo - Catálogo de precios de la práctica.
   * @param references - Referencias del nomenclador.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly administration: PracticeAdministrationService,
    private readonly servicesRepo: HealthcareServicesRepository,
    private readonly catalogRepo: ServiceCatalogRepository,
    private readonly references: ProcedureReferenceReader,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthcareServiceOffersService.name);
  }

  /**
   * `GET /practices/:practiceId/healthcare-services`.
   *
   * @param practiceId - Práctica.
   * @param practiceSiteId - Si viene, solo la oferta de esa sede.
   * @param actor - Administrador de esa organización.
   * @returns La oferta, en el orden de publicación.
   */
  async listOffers(
    practiceId: string,
    practiceSiteId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<HealthcareServiceOffersResponseDto> {
    const em = this.em.fork();
    await this.administration.assertCanAdministerPractice(
      em,
      practiceId,
      actor,
    );
    const services = await this.servicesRepo.listByPractice(
      em,
      practiceId,
      practiceSiteId,
    );
    return { items: await this.toOffers(em, services) };
  }

  /**
   * `PATCH /practices/:practiceId/healthcare-services/:id`.
   *
   * Desactivar un servicio lo saca de la búsqueda; reactivarlo lo devuelve, si
   * tiene precio. Cambiar el ítem de catálogo cambia el precio de esa sede.
   *
   * @param practiceId - Práctica.
   * @param id - Servicio.
   * @param dto - Cambios.
   * @param actor - Administrador de esa organización.
   * @returns La oferta, ya actualizada.
   */
  async updateOffer(
    practiceId: string,
    id: string,
    dto: UpdateHealthcareServiceDto,
    actor: AuthenticatedUser,
  ): Promise<HealthcareServiceOfferDto> {
    this.logger.info(
      { operation: 'practice.service.update', practiceId, serviceId: id },
      'Updating healthcare service offer',
    );
    return this.em.transactional(async (tx) => {
      await this.administration.assertCanAdministerPractice(
        tx,
        practiceId,
        actor,
      );
      const service = await this.servicesRepo.findById(tx, id);
      // Un servicio de otra práctica responde igual que uno inexistente.
      if (!service || service.practiceId !== practiceId) {
        throw practiceOutOfScope('Servicio no encontrado');
      }

      if (dto.serviceCatalogId !== undefined) {
        await assertCatalogItemFits(
          this.catalogRepo,
          tx,
          practiceId,
          service.serviceConceptId,
          dto.serviceCatalogId,
        );
        service.serviceCatalogId = dto.serviceCatalogId;
      }
      if (dto.active !== undefined) {
        service.statusConceptId = dto.active
          ? PRAC.SERVICE_ACTIVE
          : PRAC.SERVICE_SUSPENDED;
      }
      service.updatedByUserId = actor.id;
      service.updatedAt = new Date();
      await tx.flush();

      const [offer] = await this.toOffers(tx, [service]);
      return offer;
    });
  }

  /**
   * Arma las ofertas de un lote de servicios, con una lectura por tabla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param services - Servicios con sede.
   * @returns Una oferta por servicio, en el mismo orden.
   */
  private async toOffers(
    em: EntityManager,
    services: readonly HealthcareServices[],
  ): Promise<HealthcareServiceOfferDto[]> {
    if (services.length === 0) return [];
    const conceptIds = [...new Set(services.map((s) => s.serviceConceptId))];
    const catalogIds = [
      ...new Set(
        services
          .map((s) => s.serviceCatalogId)
          .filter((id): id is string => id !== undefined && id !== null),
      ),
    ];
    const [items, concepts, references] = await Promise.all([
      this.catalogRepo.findByIds(em, catalogIds),
      em.find(CatalogConcepts, { id: { $in: conceptIds } }),
      this.references.referencesFor(em, conceptIds),
    ]);
    const itemById = new Map(items.map((item) => [item.id, item]));
    const displayById = new Map(concepts.map((c) => [c.id, c.display]));

    return services.map((service) => {
      const item = service.serviceCatalogId
        ? itemById.get(service.serviceCatalogId)
        : undefined;
      // Un ítem inactivo es un precio que la sede retiró: cuenta como sin precio.
      const priced = item?.isActive === true ? item : undefined;
      const price = priced ? Number(priced.defaultPrice) : null;
      const reference = references.get(service.serviceConceptId);
      const active = service.statusConceptId === PRAC.SERVICE_ACTIVE;
      return {
        id: service.id,
        practiceSiteId: service.practiceSiteId!,
        serviceConceptId: service.serviceConceptId,
        serviceDisplay: displayById.get(service.serviceConceptId) ?? '',
        serviceCatalogId: service.serviceCatalogId ?? null,
        price,
        currencyConceptId: priced?.currencyConceptId ?? null,
        referencePrice: reference?.referencePrice ?? null,
        referenceUnit: reference?.referenceUnit ?? null,
        overMargin: null,
        visibleInSearch: active && price !== null,
        active,
      };
    });
  }
}
