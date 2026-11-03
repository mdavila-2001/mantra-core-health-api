import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../../common';
import { INS } from '../../domain/insurance.concepts';
import {
  PatientCoverages,
  CoverageDependents,
  CoordinationOfBenefits,
  BrokerClients,
  CoverageEligibilityRequests,
  CoverageEligibilityResponses,
  InsurancePlans,
  InsuranceProducts,
  InsuranceCarriers,
} from '../../entities';

/** Una cobertura de la persona, tal como la lee quien cobra. */
export interface PatientCoverageOptionRow {
  readonly coverage_id: string;
  readonly carrier_id: string;
  readonly carrier_name: string;
  readonly plan_name: string | null;
  readonly status_concept_id: string | null;
  readonly plan_status_concept_id: string | null;
  readonly effective_from: string | null;
  readonly effective_to: string | null;
  readonly plan_effective_from: string | null;
  readonly plan_effective_to: string | null;
  readonly currency_code: string | null;
  readonly currency_concept_id: string | null;
}

/** La aseguradora de un paciente, tal como la necesita quien lista consultas. */
export interface PatientCarrier {
  readonly patientProfileId: string;
  readonly carrierLegalName: string;
}

/**
 * Acceso a datos de coberturas de paciente, dependientes, coordinación de
 * beneficios (COB) y elegibilidad. Stateless. Las entidades de elegibilidad y
 * COB son de solo-alta (sin `updated_at`/`row_version`), por eso se fija
 * únicamente `createdAt`/`createdByUserId`.
 */
@Injectable()
export class CoverageRepository {
  /**
   * Obtiene find coverage.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find coverage conforme al contrato `Promise<PatientCoverages | null>`.
   */
  findCoverage(
    em: EntityManager,
    id: string,
  ): Promise<PatientCoverages | null> {
    return em.findOne(PatientCoverages, { id });
  }

  /**
   * Obtiene find by member and plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param memberIdentifier - Valor de member identifier requerido por la operación.
   * @param insurancePlanId - Identificador de insurance plan.
   * @returns Resultado de find by member and plan conforme al contrato `Promise<PatientCoverages | null>`.
   */
  findByMemberAndPlan(
    em: EntityManager,
    memberIdentifier: string,
    insurancePlanId: string,
  ): Promise<PatientCoverages | null> {
    return em.findOne(PatientCoverages, { memberIdentifier, insurancePlanId });
  }

  /**
   * La cobertura activa de un paciente en un orden dado (1 = privada, 2 = pública).
   *
   * `patient_coverages` no tiene un estado de baja más allá de `COVERAGE_ACTIVE`
   * —no existe un `COVERAGE_TERMINATED`—, así que esta consulta es lo que
   * distingue «declarar por primera vez» de «ya tenía una de este sector»: el
   * `PATCH` propio del paciente usa el resultado para no duplicar la fila ni
   * inventar un reemplazo que el modelo no declara.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Perfil de paciente.
   * @param coverageOrder - 1 para la cobertura privada, 2 para la pública.
   * @returns La cobertura activa de ese orden, o `null` si no declaró ninguna.
   */
  findActiveByPatientAndOrder(
    em: EntityManager,
    patientProfileId: string,
    coverageOrder: number,
  ): Promise<PatientCoverages | null> {
    return em.findOne(PatientCoverages, {
      patientProfileId,
      coverageOrder,
      statusConceptId: INS.COVERAGE_ACTIVE,
    });
  }

  /**
   * Todas las coberturas del paciente (privada y pública), para «Mi cobertura»
   * (CV-11). A diferencia de {@link findActiveByPatientAndOrder}, que resuelve
   * una sola por orden para no duplicarla al dar de alta, ésta es la lectura
   * completa que el titular necesita para verse a sí mismo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Perfil de paciente.
   * @returns Sus coberturas, por orden (1 = privada, 2 = pública) y luego alta.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PatientCoverages[]> {
    return em.find(
      PatientCoverages,
      { patientProfileId },
      { orderBy: { coverageOrder: 'ASC', createdAt: 'ASC' } },
    );
  }

  /**
   * Los seguros de una persona con aseguradora, plan, períodos y moneda, para
   * quien cobra (carril 16, REQ-16-026). Una sola consulta, sin beneficios ni
   * números de póliza o de afiliado: lo que la cotización necesita para elegir.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Perfil de paciente.
   * @returns Una fila por cobertura, por orden y luego alta.
   */
  findOptionsByPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PatientCoverageOptionRow[]> {
    return em.getConnection().execute<PatientCoverageOptionRow[]>(
      `select c.id as coverage_id, ca.id as carrier_id, ca.legal_name as carrier_name,
              pl.name as plan_name, c.status_concept_id,
              pl.status_concept_id as plan_status_concept_id,
              to_char(c.effective_from, 'YYYY-MM-DD') as effective_from,
              to_char(c.effective_to, 'YYYY-MM-DD') as effective_to,
              to_char(pl.effective_from, 'YYYY-MM-DD') as plan_effective_from,
              to_char(pl.effective_to, 'YYYY-MM-DD') as plan_effective_to,
              currency.code as currency_code, pl.currency_concept_id
         from insurance.patient_coverages c
         join insurance.insurance_plans pl on pl.id = c.insurance_plan_id
         join insurance.insurance_products pr on pr.id = pl.insurance_product_id
         join insurance.insurance_carriers ca on ca.id = pr.insurance_carrier_id
         left join terminology.catalog_concepts currency on currency.id = pl.currency_concept_id
        where c.patient_profile_id = ?
        order by c.coverage_order nulls last, c.created_at, c.id`,
      [patientProfileId],
    );
  }

  /**
   * Ejecuta la operación count active by patient.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador de patient profile.
   * @param statusConceptId - Identificador de status concept.
   * @returns Resultado de count active by patient conforme al contrato `Promise<number>`.
   */
  countActiveByPatient(
    em: EntityManager,
    patientProfileId: string,
    statusConceptId: string,
  ): Promise<number> {
    return em.count(PatientCoverages, { patientProfileId, statusConceptId });
  }

  /**
   * La aseguradora activa (orden 1, la privada) de cada paciente de la lista.
   *
   * ALV-021 — la agenda necesita decir «Particular» o el nombre de la
   * aseguradora en cada fila. **En lote**, como el resto de las lecturas de
   * página de este proyecto: con cien citas en pantalla, resolverlo cita por
   * cita son cien viajes a la base para pintar una columna.
   *
   * Sólo la cobertura de orden 1: es la misma que ya usa `claims-read` para
   * decidir qué mostrar como «la» aseguradora del paciente, y coincide con lo
   * que pide el criterio de ALV-021 — decir SI tiene o no, no enumerar las dos
   * que alguien puede declarar (privada + Caja).
   *
   * Un paciente sin fila en `patient_coverages`, o con la única activa dada de
   * baja, no aparece en el mapa: quien llama lo lee como `Particular`, que es
   * la ausencia de seguro y no un error de la consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileIds - Los pacientes de la página.
   * @returns Un mapa `patientProfileId → nombre legal de la aseguradora`.
   */
  async findActiveCarriersByPatients(
    em: EntityManager,
    patientProfileIds: readonly string[],
  ): Promise<Map<string, string>> {
    const byPatient = new Map<string, string>();
    if (patientProfileIds.length === 0) return byPatient;

    const coverages = await em.find(PatientCoverages, {
      patientProfileId: { $in: [...patientProfileIds] },
      coverageOrder: 1,
      statusConceptId: INS.COVERAGE_ACTIVE,
    });
    if (coverages.length === 0) return byPatient;

    const planIds = [...new Set(coverages.map((c) => c.insurancePlanId))];
    const planes = await em.find(InsurancePlans, { id: { $in: planIds } });
    const planById = new Map(planes.map((p) => [p.id, p]));

    const productIds = [...new Set(planes.map((p) => p.insuranceProductId))];
    const products = await em.find(InsuranceProducts, {
      id: { $in: productIds },
    });
    const carrierIdByProductId = new Map(
      products.map((p) => [p.id, p.insuranceCarrierId]),
    );

    const carrierIds = [...new Set(products.map((p) => p.insuranceCarrierId))];
    const carriers = await em.find(InsuranceCarriers, {
      id: { $in: carrierIds },
    });
    const nameByCarrierId = new Map(carriers.map((c) => [c.id, c.legalName]));

    for (const coverage of coverages) {
      const plan = planById.get(coverage.insurancePlanId);
      if (!plan) continue;
      const carrierId = carrierIdByProductId.get(plan.insuranceProductId);
      if (!carrierId) continue;
      const name = nameByCarrierId.get(carrierId);
      if (!name) continue;
      byPatient.set(coverage.patientProfileId, name);
    }
    return byPatient;
  }

  /**
   * Crea create coverage.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create coverage conforme al contrato `PatientCoverages`.
   */
  createCoverage(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PatientCoverages {
    return em.create(
      PatientCoverages,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create dependent.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dependent conforme al contrato `CoverageDependents`.
   */
  createDependent(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoverageDependents {
    return em.create(
      CoverageDependents,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create broker client.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create broker client conforme al contrato `BrokerClients`.
   */
  createBrokerClient(
    em: EntityManager,
    data: Record<string, unknown>,
  ): BrokerClients {
    return em.create(
      BrokerClients,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /** Devuelve la versión COB vigente (effective_to nulo) del paciente, si existe. */
  latestActiveCob(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<CoordinationOfBenefits | null> {
    return em.findOne(
      CoordinationOfBenefits,
      { patientProfileId, effectiveTo: null },
      { orderBy: { determinationVersion: 'DESC' } },
    );
  }

  /**
   * Crea create cob.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cob conforme al contrato `CoordinationOfBenefits`.
   */
  createCob(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoordinationOfBenefits {
    return em.create(
      CoordinationOfBenefits,
      {
        ...data,
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }

  // --- Elegibilidad (UC-26-03) ---
  /**
   * Obtiene find request by idempotency.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param idempotencyKey - Valor de idempotency key requerido por la operación.
   * @returns Resultado de find request by idempotency conforme al contrato `Promise<CoverageEligibilityRequests | null>`.
   */
  findRequestByIdempotency(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<CoverageEligibilityRequests | null> {
    return em.findOne(CoverageEligibilityRequests, { idempotencyKey });
  }

  /**
   * Crea create eligibility request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create eligibility request conforme al contrato `CoverageEligibilityRequests`.
   */
  createEligibilityRequest(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoverageEligibilityRequests {
    return em.create(
      CoverageEligibilityRequests,
      {
        ...data,
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }

  /**
   * Crea create eligibility response.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create eligibility response conforme al contrato `CoverageEligibilityResponses`.
   */
  createEligibilityResponse(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoverageEligibilityResponses {
    return em.create(
      CoverageEligibilityResponses,
      { ...data },
      { partial: true },
    );
  }
}
