import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import {
  patientCoverageReferenceDate,
  patientCoverageValidity,
} from '../../profiles/patient-coverage-validity';
import type {
  CoverageBenefitSummaryDto,
  OwnCoverageDto,
} from '../../profiles/dto/read-patients.dto';
import { isPublicCarrierId } from '../../../common/seed/bolivia-insurance.catalog';
import { resolveInsuranceCurrencyCode } from '../insurance-currency';
import { INS } from '../insurance.concepts';

/** El mismo objeto sin las claves `null`/`undefined` (patrón de `profiles-patients.service.ts`). */
function sinCamposAusentes<T extends object>(respuesta: T): T {
  return Object.fromEntries(
    Object.entries(respuesta).filter(
      ([, valor]) => valor !== null && valor !== undefined,
    ),
  ) as T;
}

/**
 * Lee las coberturas de seguro **declaradas** por un paciente, con la
 * aseguradora, el plan y sus beneficios ya en palabras.
 *
 * ## Por qué vive acá y no repetida en `profiles`/`clinical`
 *
 * Es exactamente la consulta que `GET /profiles/patients/me` usa para su
 * bloque `coverages` (`ProfilesPatientsService.leerCoberturas`, hasta la
 * subtarea B.3). El PDF oficial de receta (`clinical`) necesita el mismo
 * bloque para imprimir «cobertura declarada, no verificada» — duplicar el
 * SQL en dos módulos es la clase de regla que diverge el día que sólo se
 * corrige en un lado. Vive en `insurance` porque las tres tablas que lee
 * (`patient_coverages`, `insurance_plans`, `insurance_plan_benefits`) son
 * suyas; `profiles` y `clinical` la consumen como provider suelto, mismo
 * criterio que el resto de los repositorios "sin estado" del proyecto.
 *
 * ## Qué es y qué no es
 *
 * Es lo que el paciente **declaró** al registrarse o lo que alguien cargó a
 * mano, no una liquidación con aseguradora. `verified` distingue una cosa de
 * la otra; nunca lo hace el mero hecho de tener la fila.
 *
 * `insurance` no importa `profiles`, `clinical` ni `chart`: sólo toma tipos
 * (`OwnCoverageDto`) de `profiles/dto`, que no cierra ningún ciclo de módulos
 * Nest — es una importación de TypeScript, no de `ProfilesModule`.
 */
@Injectable()
export class DeclaredCoveragesReader {
  /**
   * Las coberturas declaradas de un paciente, con sus beneficios vigentes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyas coberturas se leen.
   * @returns Las coberturas, ordenadas por `coverage_order`; lista vacía si
   *   no declaró ninguna.
   */
  async read(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<OwnCoverageDto[]> {
    const referenceDate = patientCoverageReferenceDate();
    const filas = await em.getConnection().execute<
      {
        coverage_id: string;
        carrier_id: string;
        carrier_name: string;
        plan_name: string | null;
        member_identifier: string | null;
        policy_identifier: string | null;
        verification_status_concept_id: string | null;
        status_display: string | null;
        status_code: string | null;
        status_concept_id: string | null;
        plan_status_concept_id: string | null;
        plan_effective_from: string | null;
        plan_effective_to: string | null;
        effective_from: string | null;
        effective_to: string | null;
        insurance_plan_id: string;
        currency_code: string | null;
        currency_concept_id: string | null;
        whatsapp_number: string | null;
        call_center_phone: string | null;
        coverage_order: number | null;
      }[]
    >(
      `select c.id as coverage_id, ca.id as carrier_id, ca.legal_name as carrier_name,
              pl.name as plan_name, c.member_identifier, c.policy_identifier,
              c.verification_status_concept_id, coverage_status.display as status_display,
              coverage_status.code as status_code, c.status_concept_id,
              pl.status_concept_id as plan_status_concept_id,
              to_char(c.effective_from, 'YYYY-MM-DD') as effective_from,
              to_char(c.effective_to, 'YYYY-MM-DD') as effective_to,
              to_char(pl.effective_from, 'YYYY-MM-DD') as plan_effective_from,
              to_char(pl.effective_to, 'YYYY-MM-DD') as plan_effective_to,
              c.insurance_plan_id,
              currency.code as currency_code, pl.currency_concept_id,
              ca.whatsapp_number, ca.call_center_phone,
              c.coverage_order
         from insurance.patient_coverages c
         join insurance.insurance_plans pl on pl.id = c.insurance_plan_id
         join insurance.insurance_products pr on pr.id = pl.insurance_product_id
         join insurance.insurance_carriers ca on ca.id = pr.insurance_carrier_id
         left join terminology.catalog_concepts coverage_status on coverage_status.id = c.status_concept_id
         left join terminology.catalog_concepts currency on currency.id = pl.currency_concept_id
        where c.patient_profile_id = ?
        order by c.coverage_order nulls last, c.id`,
      [patientProfileId],
    );
    if (filas.length === 0) return [];

    const planIds = [...new Set(filas.map((fila) => fila.insurance_plan_id))];
    const beneficios = await em.getConnection().execute<
      {
        id: string;
        insurance_plan_id: string;
        status_code: string | null;
        status_concept_id: string | null;
        category_code: string | null;
        category_name: string | null;
        service_concept_id: string | null;
        service_name: string | null;
        coverage_percent: string | null;
        copay_amount: string | null;
        deductible_amount: string | null;
        effective_from: string | null;
        effective_to: string | null;
      }[]
    >(
      `select b.id, b.insurance_plan_id, category.code as category_code,
              category.display as category_name, b.service_concept_id,
              service.display as service_name, b.coverage_percent, b.copay_amount,
              b.deductible_amount, benefit_status.code as status_code, b.status_concept_id,
              to_char(b.effective_from, 'YYYY-MM-DD') as effective_from,
              to_char(b.effective_to, 'YYYY-MM-DD') as effective_to
         from insurance.insurance_plan_benefits b
         left join terminology.catalog_concepts benefit_status on benefit_status.id = b.status_concept_id
         left join terminology.catalog_concepts category on category.id = b.benefit_category_concept_id
         left join terminology.catalog_concepts service on service.id = b.service_concept_id
        where b.insurance_plan_id in (${planIds.map(() => '?').join(', ')})
        order by b.insurance_plan_id, b.created_at, b.id`,
      planIds,
    );
    const benefitsByPlan = new Map<string, typeof beneficios>();
    for (const beneficio of beneficios) {
      const current = benefitsByPlan.get(beneficio.insurance_plan_id) ?? [];
      current.push(beneficio);
      benefitsByPlan.set(beneficio.insurance_plan_id, current);
    }

    return filas.map((fila) => {
      const periods = [
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
      ];
      return sinCamposAusentes({
        id: fila.coverage_id,
        carrierName: fila.carrier_name,
        planName: fila.plan_name,
        isPublic: isPublicCarrierId(fila.carrier_id),
        policyIdentifier: fila.policy_identifier,
        memberIdentifier: fila.member_identifier,
        verified: fila.verification_status_concept_id === INS.VERIFY_VERIFIED,
        status: fila.status_display,
        statusCode: fila.status_code,
        validityStatus: patientCoverageValidity(referenceDate, periods),
        referenceDate,
        effectiveFrom: fila.effective_from,
        effectiveTo: fila.effective_to,
        currencyCode: resolveInsuranceCurrencyCode(
          fila.currency_concept_id,
          fila.currency_code,
        ),
        carrierWhatsappNumber: fila.whatsapp_number,
        carrierCallCenterPhone: fila.call_center_phone,
        benefits: (benefitsByPlan.get(fila.insurance_plan_id) ?? []).map(
          (benefit) =>
            sinCamposAusentes({
              id: benefit.id,
              statusCode: benefit.status_code,
              categoryCode: benefit.category_code,
              categoryName: benefit.category_name,
              serviceConceptId: benefit.service_concept_id,
              serviceName: benefit.service_name,
              coveragePercent: benefit.coverage_percent,
              copayAmount: benefit.copay_amount,
              deductibleAmount: benefit.deductible_amount,
              effectiveFrom: benefit.effective_from,
              effectiveTo: benefit.effective_to,
              validityStatus: patientCoverageValidity(referenceDate, [
                ...periods,
                {
                  statusConceptId: benefit.status_concept_id,
                  activeConceptId: INS.BENEFIT_ACTIVE,
                  effectiveFrom: benefit.effective_from,
                  effectiveTo: benefit.effective_to,
                },
              ]),
            }) as CoverageBenefitSummaryDto,
        ),
        planId: fila.insurance_plan_id,
        coverageOrder: fila.coverage_order ?? 0,
      }) as OwnCoverageDto;
    });
  }
}
