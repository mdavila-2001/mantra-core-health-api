import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { coordinateOf } from '../../../common/geo/straight-line-distance';
import { ServiceCatalog } from '../../billing/entities';
import { Addresses } from '../../common/entities';
import {
  HealthcareServices,
  PracticeSites,
  Practices,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { CatalogConcepts } from '../../terminology/entities';
import {
  MedicalCenterOffersPort,
  type SiteOfferRow,
} from '../ports/medical-center.ports';

/** Propiedad del nomenclador que guarda la especialidad de cada procedimiento. */
const SPECIALTY_PROPERTY = 'procedure:specialty';

/**
 * Las ofertas con precio de las sedes, leídas de `practice` y `billing`.
 *
 * Solo entra lo que el paciente podría contratar hoy: una sede activa de una
 * práctica activa, con el servicio activo y un ítem de catálogo activo con
 * moneda. Lo que no tiene precio publicado no aparece, y eso lo decide esta
 * consulta, no el front.
 */
@Injectable()
export class MedicalCenterOffersRepository extends MedicalCenterOffersPort {
  /** @inheritdoc */
  async findSiteOffers(
    em: EntityManager,
    procedureConceptIds: readonly string[],
  ): Promise<SiteOfferRow[]> {
    if (procedureConceptIds.length === 0) return [];

    const services = await em.find(HealthcareServices, {
      serviceConceptId: { $in: [...procedureConceptIds] },
      statusConceptId: PRAC.SERVICE_ACTIVE,
      serviceCatalogId: { $ne: null },
      practiceSiteId: { $ne: null },
    });
    if (services.length === 0) return [];

    const [items, sites] = await Promise.all([
      em.find(ServiceCatalog, {
        id: { $in: unique(services.map((s) => s.serviceCatalogId)) },
        isActive: true,
      }),
      em.find(PracticeSites, {
        id: { $in: unique(services.map((s) => s.practiceSiteId)) },
        statusConceptId: PRAC.SITE_ACTIVE,
      }),
    ]);
    const practices = await em.find(
      Practices,
      {
        id: { $in: unique(sites.map((site) => site.practiceId)) },
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      },
      { fields: ['id'] },
    );
    const activePracticeIds = new Set(practices.map((p) => p.id));
    const itemById = new Map(items.map((item) => [item.id, item]));
    const siteById = new Map(
      sites
        .filter((site) => activePracticeIds.has(site.practiceId))
        .map((site) => [site.id, site]),
    );

    const [addresses, concepts, specialties] = await Promise.all([
      em.find(Addresses, {
        id: { $in: unique([...siteById.values()].map((s) => s.addressId)) },
      }),
      em.find(
        CatalogConcepts,
        { id: { $in: [...procedureConceptIds] } },
        { fields: ['id', 'display'] },
      ),
      this.specialtiesOf(em, procedureConceptIds),
    ]);
    const addressById = new Map(addresses.map((a) => [a.id, a]));
    const displayById = new Map(concepts.map((c) => [c.id, c.display]));

    const rows: SiteOfferRow[] = [];
    for (const service of services) {
      const item = itemById.get(service.serviceCatalogId!);
      const site = siteById.get(service.practiceSiteId!);
      // Un precio sin moneda no se puede mostrar ni sumar: no es una oferta.
      if (!item?.currencyConceptId || !site) continue;
      const address = site.addressId
        ? addressById.get(site.addressId)
        : undefined;
      rows.push({
        practiceId: site.practiceId,
        practiceSiteId: site.id,
        siteName: site.name,
        addressText: address ? addressLine(address) : null,
        city: address?.city?.trim() || null,
        latitude: coordinateOf(address?.latitude),
        longitude: coordinateOf(address?.longitude),
        procedureConceptId: service.serviceConceptId,
        procedureDisplay: displayById.get(service.serviceConceptId) ?? '',
        procedureSpecialty: specialties.get(service.serviceConceptId) ?? null,
        price: Number(item.defaultPrice),
        currencyConceptId: item.currencyConceptId,
      });
    }
    return rows;
  }

  /**
   * La especialidad de cada procedimiento, en una sola consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conceptIds - Procedimientos pedidos.
   * @returns Concepto → especialidad; los que no la tienen no figuran.
   */
  private async specialtiesOf(
    em: EntityManager,
    conceptIds: readonly string[],
  ): Promise<Map<string, string>> {
    const markers = conceptIds.map(() => '?').join(', ');
    const rows = await em
      .getConnection()
      .execute<{ concept_id: string; valor: string | null }[]>(
        `SELECT p.concept_id, p.value_json #>> '{}' AS valor
           FROM terminology.concept_properties p
          WHERE p.property_code = ?
            AND p.concept_id IN (${markers})`,
        [SPECIALTY_PROPERTY, ...conceptIds],
      );
    return new Map(
      rows
        .filter((row) => row.valor !== null)
        .map((row) => [row.concept_id, row.valor as string]),
    );
  }
}

/** Los ids distintos y presentes de una lista. */
function unique(ids: readonly (string | null | undefined)[]): string[] {
  return [
    ...new Set(
      ids.filter((id): id is string => id !== null && id !== undefined),
    ),
  ];
}

/** La dirección en una línea legible, o `null` si no tiene ninguna pieza. */
function addressLine(address: Addresses): string | null {
  const parts = [address.lines, address.city, address.postalCode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length === 0 ? null : parts.join(', ');
}
