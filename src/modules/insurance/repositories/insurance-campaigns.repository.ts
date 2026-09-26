import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { InsuranceCampaignPartners, InsuranceCampaigns } from '../entities';
import { INS } from '../insurance.concepts';
import { patientCoverageValidity } from '../../profiles/patient-coverage-validity';

/** Un aliado tal como sale de la consulta (columnas de `json_build_object`). */
export interface CampaignPartnerRow {
  readonly id: string;
  readonly role_concept_id: string;
  readonly type_concept_id: string;
  readonly name: string;
  readonly network_provider_membership_id: string | null;
}

/** Una campaña con su patología resuelta y sus aliados, en una sola fila. */
export interface CampaignRow {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly campaign_type_concept_id: string;
  readonly status_concept_id: string;
  readonly target_condition_code: string | null;
  readonly target_condition_display: string | null;
  readonly copay_bonus_percentage: string;
  readonly valid_from: string;
  readonly valid_to: string;
  readonly activated_at: string | null;
  /** ISO 8601 en UTC con microsegundos: sirve además de llave del cursor. */
  readonly created_at: string;
  readonly updated_at: string;
  readonly partners: CampaignPartnerRow[];
}

/** Fila de campaña vigente para un afiliado: agrega el nombre de la aseguradora. */
export interface PatientCampaignRow extends CampaignRow {
  readonly carrier_name: string;
}

/** Filtros del listado administrativo, ya traducidos a ids de concepto. */
export interface CampaignListFilters {
  readonly typeConceptId?: string;
  readonly statusConceptId?: string;
  /** Llave de la última fila de la página anterior. */
  readonly after?: { readonly createdAt: string; readonly id: string };
  /** Se pide una fila de más para saber si hay página siguiente. */
  readonly limit: number;
}

const TS_UTC = `'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'`;

/**
 * Columnas comunes de la consulta de campañas. Trae la patología (código y
 * texto del concepto CIE-10) y los aliados sin producto cartesiano: los aliados
 * van en una subconsulta correlacionada que devuelve un arreglo JSON.
 */
const CAMPAIGN_COLUMNS = `
  c.id, c.code, c.title, c.description,
  c.campaign_type_concept_id, c.status_concept_id,
  cond.code as target_condition_code, cond.display as target_condition_display,
  c.copay_bonus_percentage::text as copay_bonus_percentage,
  to_char(c.valid_from, 'YYYY-MM-DD') as valid_from,
  to_char(c.valid_to, 'YYYY-MM-DD') as valid_to,
  to_char(c.activated_at at time zone 'UTC', ${TS_UTC}) as activated_at,
  to_char(c.created_at at time zone 'UTC', ${TS_UTC}) as created_at,
  to_char(c.updated_at at time zone 'UTC', ${TS_UTC}) as updated_at,
  (select coalesce(
            json_agg(json_build_object(
              'id', p.id,
              'role_concept_id', p.partner_role_concept_id,
              'type_concept_id', p.partner_type_concept_id,
              'name', p.partner_name,
              'network_provider_membership_id', p.network_provider_membership_id
            ) order by p.created_at, p.id),
            '[]'::json)
     from insurance.insurance_campaign_partners p
    where p.insurance_campaign_id = c.id) as partners`;

/**
 * Acceso a datos de las campañas preventivas de la aseguradora (Tarea 4).
 * Stateless: cada método recibe el `EntityManager` de la transacción del
 * servicio. TODA consulta va acotada por `insurance_carrier_id`: una campaña de
 * otra aseguradora nunca es alcanzable desde acá.
 */
@Injectable()
export class InsuranceCampaignsRepository {
  /** Campaña de la aseguradora con ese código, para detectar duplicados. */
  findByCarrierAndCode(
    em: EntityManager,
    insuranceCarrierId: string,
    code: string,
  ): Promise<InsuranceCampaigns | null> {
    return em.findOne(InsuranceCampaigns, { insuranceCarrierId, code });
  }

  /** Entidad (para mutarla) acotada a la aseguradora; `null` si es de otra. */
  findEntityForCarrier(
    em: EntityManager,
    insuranceCarrierId: string,
    id: string,
  ): Promise<InsuranceCampaigns | null> {
    return em.findOne(InsuranceCampaigns, { id, insuranceCarrierId });
  }

  createCampaign(
    em: EntityManager,
    data: Record<string, unknown> & { actorUserId?: string },
  ): InsuranceCampaigns {
    const { actorUserId, ...fields } = data;
    return em.create(
      InsuranceCampaigns,
      { ...fields, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createPartner(
    em: EntityManager,
    data: Record<string, unknown> & { actorUserId?: string },
  ): InsuranceCampaignPartners {
    const { actorUserId, ...fields } = data;
    return em.create(
      InsuranceCampaignPartners,
      { ...fields, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Resuelve un código CIE-10 al id de su concepto. Prefiere la versión por
   * defecto del sistema de códigos. `null` si el catálogo no lo conoce.
   */
  async resolveIcd10ConceptId(
    em: EntityManager,
    code: string,
  ): Promise<string | null> {
    const filas = await em.getConnection().execute<{ id: string }[]>(
      `select cc.id
         from terminology.catalog_concepts cc
         join terminology.code_system_versions csv on csv.id = cc.code_system_version_id
         join terminology.code_systems cs on cs.id = csv.code_system_id
        where cs.internal_code = 'icd10cm' and cc.code = ?
        order by csv.is_default desc nulls last, cc.id
        limit 1`,
      [code],
    );
    return filas[0]?.id ?? null;
  }

  /** Una campaña de la aseguradora, con aliados y patología. */
  async getRowForCarrier(
    em: EntityManager,
    insuranceCarrierId: string,
    id: string,
  ): Promise<CampaignRow | null> {
    const filas = await em.getConnection().execute<CampaignRow[]>(
      `select ${CAMPAIGN_COLUMNS}
         from insurance.insurance_campaigns c
         left join terminology.catalog_concepts cond on cond.id = c.target_condition_concept_id
        where c.insurance_carrier_id = ? and c.id = ?`,
      [insuranceCarrierId, id],
    );
    return filas[0] ?? null;
  }

  /**
   * Página del listado administrativo, de la más nueva a la más vieja
   * (`created_at desc, id desc`). Devuelve hasta `limit` filas.
   */
  listRowsByCarrier(
    em: EntityManager,
    insuranceCarrierId: string,
    filters: CampaignListFilters,
  ): Promise<CampaignRow[]> {
    const where = ['c.insurance_carrier_id = ?'];
    const params: unknown[] = [insuranceCarrierId];
    if (filters.typeConceptId) {
      where.push('c.campaign_type_concept_id = ?');
      params.push(filters.typeConceptId);
    }
    if (filters.statusConceptId) {
      where.push('c.status_concept_id = ?');
      params.push(filters.statusConceptId);
    }
    if (filters.after) {
      where.push('(c.created_at, c.id) < (?::timestamptz, ?::uuid)');
      params.push(filters.after.createdAt, filters.after.id);
    }
    params.push(filters.limit);
    return em.getConnection().execute<CampaignRow[]>(
      `select ${CAMPAIGN_COLUMNS}
         from insurance.insurance_campaigns c
         left join terminology.catalog_concepts cond on cond.id = c.target_condition_concept_id
        where ${where.join(' and ')}
        order by c.created_at desc, c.id desc
        limit ?`,
      params,
    );
  }

  /**
   * Aseguradoras de las coberturas VIGENTES del afiliado. La vigencia usa la
   * misma regla que el resto de la app (`patientCoverageValidity`): cobertura
   * y plan activos y la fecha de referencia dentro de ambos rangos. Una
   * cobertura de vigencia desconocida NO cuenta: ante la duda no se anuncia.
   */
  async findCurrentCarrierIdsForPatient(
    em: EntityManager,
    patientProfileId: string,
    referenceDate: string,
  ): Promise<string[]> {
    const filas = await em.getConnection().execute<
      {
        carrier_id: string;
        status_concept_id: string | null;
        plan_status_concept_id: string | null;
        effective_from: string | null;
        effective_to: string | null;
        plan_effective_from: string | null;
        plan_effective_to: string | null;
      }[]
    >(
      `select ca.id as carrier_id, c.status_concept_id,
              pl.status_concept_id as plan_status_concept_id,
              to_char(c.effective_from, 'YYYY-MM-DD') as effective_from,
              to_char(c.effective_to, 'YYYY-MM-DD') as effective_to,
              to_char(pl.effective_from, 'YYYY-MM-DD') as plan_effective_from,
              to_char(pl.effective_to, 'YYYY-MM-DD') as plan_effective_to
         from insurance.patient_coverages c
         join insurance.insurance_plans pl on pl.id = c.insurance_plan_id
         join insurance.insurance_products pr on pr.id = pl.insurance_product_id
         join insurance.insurance_carriers ca on ca.id = pr.insurance_carrier_id
        where c.patient_profile_id = ?`,
      [patientProfileId],
    );
    const vigentes = filas.filter(
      (fila) =>
        patientCoverageValidity(referenceDate, [
          {
            statusConceptId: fila.status_concept_id,
            activeConceptId: INS.COVERAGE_ACTIVE,
            effectiveFrom: fila.effective_from,
            effectiveTo: fila.effective_to,
          },
          {
            statusConceptId: fila.plan_status_concept_id,
            activeConceptId: INS.PLAN_ACTIVE,
            effectiveFrom: fila.plan_effective_from,
            effectiveTo: fila.plan_effective_to,
          },
        ]) === 'CURRENT',
    );
    return [...new Set(vigentes.map((fila) => fila.carrier_id))];
  }

  /**
   * Campañas ACTIVAS y dentro de su ventana de fechas de las aseguradoras
   * dadas. Una campaña ACTIVE cuya `valid_to` ya pasó no sale aunque nadie la
   * haya cerrado: el vencimiento efectivo lo manda la fecha, no un cron.
   */
  listActiveRowsForCarriers(
    em: EntityManager,
    insuranceCarrierIds: readonly string[],
    referenceDate: string,
  ): Promise<PatientCampaignRow[]> {
    if (insuranceCarrierIds.length === 0) return Promise.resolve([]);
    return em.getConnection().execute<PatientCampaignRow[]>(
      `select ${CAMPAIGN_COLUMNS}, ca.legal_name as carrier_name
         from insurance.insurance_campaigns c
         join insurance.insurance_carriers ca on ca.id = c.insurance_carrier_id
         left join terminology.catalog_concepts cond on cond.id = c.target_condition_concept_id
        where c.insurance_carrier_id in (${insuranceCarrierIds.map(() => '?').join(', ')})
          and c.status_concept_id = ?
          and c.valid_from <= ?::date
          and c.valid_to >= ?::date
        order by c.valid_to, c.created_at desc, c.id desc`,
      [
        ...insuranceCarrierIds,
        INS.CAMPAIGN_ACTIVE,
        referenceDate,
        referenceDate,
      ],
    );
  }
}
