import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import {
  BOLIVIA_CARRIERS,
  BOLIVIA_PUBLIC_INSURERS,
  carrierId,
  isPublicCarrierId,
} from '../../../common/seed/bolivia-insurance.catalog';
import {
  InsuranceCarriers,
  InsurancePlans,
  InsuranceProducts,
} from '../entities';
import { INS } from '../insurance.concepts';
import type { CarrierCatalogEntryDto, CarrierCatalogResponseDto } from '../dto';

/**
 * El catálogo de aseguradoras que se ofrece a quien se está registrando.
 *
 * ## Por qué no lo sirve `InsuranceReadService`
 *
 * Porque aquél lista las aseguradoras **del tenant activo**, y acá no hay
 * tenant: quien se registra todavía no pertenece a ninguno. Peor: el seed le da
 * a cada aseguradora su propio tenant —`insurance_carriers.tenant_id` es
 * único—, así que una lectura tenant-scoped desde el tenant de un paciente
 * devuelve la lista vacía. Son dos contratos distintos, no dos usos del mismo.
 *
 * ## Por qué esta lectura cruza tenants sin ser una fuga
 *
 * Porque no consulta «todas las aseguradoras que haya»: pide exactamente los
 * identificadores del catálogo boliviano sembrado, que son públicos y los
 * mismos para todo el mundo. Una aseguradora cargada por otra vía no entra en
 * el `$in` y por lo tanto no se filtra.
 */
@Injectable()
export class InsuranceCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Aseguradoras del catálogo boliviano con sus planes de salud activos.
   *
   * @returns Privadas y públicas, cada una con sus planes.
   */
  async listHealthCatalog(): Promise<CarrierCatalogResponseDto> {
    const ids = [
      ...BOLIVIA_CARRIERS.map((c) => carrierId(c.code)),
      ...BOLIVIA_PUBLIC_INSURERS.map((c) => carrierId(c.code)),
    ];

    const carriers = await this.em.find(InsuranceCarriers, {
      id: { $in: ids },
      statusConceptId: INS.CARRIER_ACTIVE,
    });
    if (carriers.length === 0) {
      return { carriers: [] };
    }

    const products = await this.em.find(InsuranceProducts, {
      insuranceCarrierId: { $in: carriers.map((c) => c.id) },
    });
    const plans = products.length
      ? await this.em.find(InsurancePlans, {
          insuranceProductId: { $in: products.map((p) => p.id) },
          statusConceptId: INS.PLAN_ACTIVE,
        })
      : [];

    const carrierByProduct = new Map(
      products.map((p) => [p.id, p.insuranceCarrierId]),
    );
    const plansByCarrier = new Map<string, InsurancePlans[]>();
    for (const plan of plans) {
      const owner = carrierByProduct.get(plan.insuranceProductId);
      if (!owner) continue;
      const bucket = plansByCarrier.get(owner);
      if (bucket) bucket.push(plan);
      else plansByCarrier.set(owner, [plan]);
    }

    const entries: CarrierCatalogEntryDto[] = carriers.map((carrier) => ({
      id: carrier.id,
      code: carrier.carrierCode,
      name: carrier.sigla ?? carrier.legalName,
      legalName: carrier.legalName,
      isPublic: isPublicCarrierId(carrier.id),
      plans: (plansByCarrier.get(carrier.id) ?? []).map((plan) => ({
        id: plan.id,
        // `plan_code` viaja prefijado con el código de la aseguradora; a la
        // pantalla le sirve el sufijo, que es lo que distingue un plan de otro
        // dentro de la misma compañía.
        code: plan.planCode.startsWith(`${carrier.carrierCode}_`)
          ? plan.planCode.slice(carrier.carrierCode.length + 1)
          : plan.planCode,
        name: plan.name,
      })),
    }));

    entries.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { carriers: entries };
  }
}
