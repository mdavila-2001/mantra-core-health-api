import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import {
  BOLIVIA_CARRIERS,
  BOLIVIA_CURATED_CARRIERS,
  BOLIVIA_PUBLIC_INSURERS,
  carrierId,
  isPublicCarrierId,
} from '../../../../common/seed/bolivia-insurance.catalog';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { DIR } from '../../../directory/directory.concepts';
import {
  InsuranceCarriers,
  InsurancePlans,
  InsuranceProducts,
} from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import type {
  CarrierCatalogEntryDto,
  CarrierCatalogResponseDto,
} from '../../presentation/dto';

/**
 * Rótulo de un seguro público: «Caja de Salud de la Banca Privada - CSBP».
 *
 * La sigla sólo se agrega si es una sigla de verdad (mayúsculas): «Caja de
 * Caminos» es el nombre corto de su caja, no una sigla, y repetirlo junto al
 * nombre completo sería ruido.
 *
 * @param legalName - Nombre oficial de la caja o del sistema.
 * @param sigla - Sigla con la que se lo conoce, si la hay.
 * @returns El nombre completo, seguido de la sigla cuando corresponde.
 */
function publicCarrierLabel(legalName: string, sigla?: string | null): string {
  const isAcronym = sigla != null && /^[A-Z]{2,}$/.test(sigla);
  return isAcronym && sigla !== legalName
    ? `${legalName} - ${sigla}`
    : legalName;
}

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
 *
 * ## Qué aseguradoras privadas se ofrecen
 *
 * Sólo las que tienen una **cuenta registrada**: un tenant activo con al menos
 * un OWNER o ADMIN vigente, usuario activo y con una credencial activa. Una
 * privada del catálogo sin esa cuenta no puede atender a quien la elija, así que
 * no se le ofrece. Los seguros públicos (CNS, CPS, SUS, cajas) no dependen de una
 * cuenta y se ofrecen siempre.
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
    const privateIds = [
      ...BOLIVIA_CARRIERS.map((c) => carrierId(c.code)),
      ...BOLIVIA_CURATED_CARRIERS.map((c) => carrierId(c.code)),
    ];
    const ids = [
      ...(await this.findPrivateWithAccount(privateIds)),
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

    const entries: CarrierCatalogEntryDto[] = carriers.map((carrier) => {
      const isPublic = isPublicCarrierId(carrier.id);
      return {
        id: carrier.id,
        code: carrier.carrierCode,
        // Las cajas y el SUS se rotulan «Nombre completo - SIGLA»: «CORDES» o
        // «CSBP» a secas no le dicen nada a quien tiene que elegir la suya. Las
        // privadas siguen con su marca comercial.
        name: isPublic
          ? publicCarrierLabel(carrier.legalName, carrier.sigla)
          : (carrier.sigla ?? carrier.legalName),
        legalName: carrier.legalName,
        isPublic,
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
      };
    });

    entries.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { carriers: entries };
  }

  /**
   * De las aseguradoras privadas dadas, las que tienen una cuenta registrada.
   *
   * Una sola consulta con `exists`: aseguradora activa con tenant activo y una
   * membresía OWNER/ADMIN vigente de un usuario activo con credencial activa y
   * sin vencer.
   *
   * @param privateIds - Identificadores de las privadas del catálogo.
   * @returns Los identificadores que cumplen.
   */
  private async findPrivateWithAccount(
    privateIds: string[],
  ): Promise<string[]> {
    const rows = await this.em.getConnection().execute<{ id: string }[]>(
      `select cr.id from insurance.insurance_carriers cr
        where cr.id in (${privateIds.map(() => '?').join(', ')})
          and cr.status_concept_id = ?
          and cr.tenant_id is not null
          and exists (
            select 1 from directory.tenants t
              join directory.tenant_memberships tm on tm.tenant_id = t.id
              join iam.users u on u.id = tm.user_id
             where t.id = cr.tenant_id and t.status_concept_id = ?
               and tm.status_concept_id = ?
               and tm.tenant_role_concept_id in (?, ?)
               and tm.start_date <= now()
               and (tm.end_date is null or tm.end_date > now())
               and u.status_concept_id = ?
               and exists (
                 select 1 from iam.authentication_credentials ac
                  where ac.user_id = u.id and ac.state_concept_id = ?
                    and (ac.expires_at is null or ac.expires_at > now())
               )
          )`,
      [
        ...privateIds,
        INS.CARRIER_ACTIVE,
        CONCEPTS.TENANT_ACTIVE,
        DIR.MEMBERSHIP_ACTIVE,
        DIR.ROLE_OWNER,
        DIR.ROLE_ADMIN,
        CONCEPTS.USER_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    return rows.map((row) => row.id);
  }
}
