import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { INS } from '../insurance.concepts';
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
} from '../entities';

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
    const porPaciente = new Map<string, string>();
    if (patientProfileIds.length === 0) return porPaciente;

    const coberturas = await em.find(PatientCoverages, {
      patientProfileId: { $in: [...patientProfileIds] },
      coverageOrder: 1,
      statusConceptId: INS.COVERAGE_ACTIVE,
    });
    if (coberturas.length === 0) return porPaciente;

    const planIds = [...new Set(coberturas.map((c) => c.insurancePlanId))];
    const planes = await em.find(InsurancePlans, { id: { $in: planIds } });
    const planById = new Map(planes.map((p) => [p.id, p]));

    const productIds = [...new Set(planes.map((p) => p.insuranceProductId))];
    const productos = await em.find(InsuranceProducts, {
      id: { $in: productIds },
    });
    const carrierIdByProductId = new Map(
      productos.map((p) => [p.id, p.insuranceCarrierId]),
    );

    const carrierIds = [...new Set(productos.map((p) => p.insuranceCarrierId))];
    const carriers = await em.find(InsuranceCarriers, {
      id: { $in: carrierIds },
    });
    const nameByCarrierId = new Map(carriers.map((c) => [c.id, c.legalName]));

    for (const cobertura of coberturas) {
      const plan = planById.get(cobertura.insurancePlanId);
      if (!plan) continue;
      const carrierId = carrierIdByProductId.get(plan.insuranceProductId);
      if (!carrierId) continue;
      const nombre = nameByCarrierId.get(carrierId);
      if (!nombre) continue;
      porPaciente.set(cobertura.patientProfileId, nombre);
    }
    return porPaciente;
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
