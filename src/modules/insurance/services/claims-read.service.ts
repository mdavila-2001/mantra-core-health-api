import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  requireTenantId,
  sumarDecimales,
} from '../../../common';
import { CatalogConcepts } from '../../terminology/entities';
import { Persons, PatientProfiles } from '../../profiles/entities';
import { PracticeTenantLookupService } from '../../practice/services';
import { ServiceRequests } from '../../clinical/entities';
import { DuplicateStudyDetector } from '../../clinical/services/duplicate-study-detector';
import { DiagnosticUnits } from '../../diagnostic_units/entities';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import type {
  ClaimAdjudicationVersions,
  ClaimDisputes,
  ClaimLineAdjudications,
  InsuranceBrokers,
  InsuranceClaimLines,
  InsuranceClaims,
} from '../entities';
import { InsuranceBrokers as InsuranceBrokersEntity } from '../entities';
import type {
  ClaimAdjudicationDto,
  ClaimDetailDto,
  ClaimDisputeSummaryDto,
  ClaimLineDuplicateStudyDto,
  ClaimLineViewDto,
  ClaimListItemDto,
  ClaimListQueryDto,
  ClaimListResponseDto,
  InsuranceConceptDto,
  MoneyDto,
} from '../dto';
import { INS } from '../insurance.concepts';
import {
  ClaimReadRepository,
  type ClaimCursor,
  type ClaimListFilters,
} from '../repositories';

/** Tamaño de página por defecto del listado de solicitudes. */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Único texto con el que esta cara rechaza el acceso a una solicitud.
 *
 * AC-16-14 exige que «no es tuya» y «ese uuid no existe» sean indistinguibles.
 * La forma de garantizarlo es que **haya un solo lugar** donde se construye el
 * rechazo: dos mensajes distintos, aunque hoy dijeran lo mismo, se separan en
 * cuanto alguien edite uno.
 */
const CLAIM_ACCESS_DENIED = 'No hay acceso a esa solicitud de seguro';

/**
 * Lectura de solicitudes de seguro presentadas: listado y detalle.
 *
 * El módulo 26 tenía once controladores y **ninguna lectura de solicitudes**:
 * se podía presentar un reclamo, adjudicarlo, revertirlo y disputarlo, y no
 * había forma de volver a verlo. Esto agrega esa cara; no relaja ninguna
 * escritura.
 *
 * Cuatro reglas gobiernan todo lo de acá:
 *
 * - **El alcance es el del prestador que envió la solicitud** (TAREA-16 · D1.a,
 *   decisión de Justin del 2026-09-04): son «solicitudes **enviadas**», así que
 *   la pantalla es la del consultorio o la clínica que las presenta. La
 *   solicitud no tiene `tenant_id`, pero sí `billing_provider_entity_id`, que
 *   con el tipo `BILLING_PROVIDER_TYPE_PRACTICE` es una `practice.practices`.
 *   Toda consulta arranca por las prácticas activas de la organización activa.
 * - **Fuera de alcance e inexistente se responden igual**: un 403 con el mismo
 *   cuerpo en los dos casos. Si el id viajara en `details`, el error volvería a
 *   servir de sonda (AC-16-14).
 * - **Los importes no se recalculan.** Si la adjudicación ya trae
 *   `total_approved_amount`, ése es el número; sumar las líneas por segunda vez
 *   es cómo nacen los descuadres. Lo que sí se suma es el total de líneas
 *   facturadas, y se suma con aritmética decimal exacta para que la pantalla
 *   pueda compararlo **como cadena** contra el declarado.
 * - **Mínimo clínico.** De la atención no viaja ni el motivo ni el
 *   diagnóstico: la solicitud identifica el documento de origen y nada más.
 *   Un listado de reclamos ya es, de por sí, una lista de pacientes.
 */
@Injectable()
export class ClaimsReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param claimRepo - Consultas de lectura del ciclo del reclamo.
   * @param practiceLookup - Puerto de `practice`: las prácticas de la organización.
   * @param duplicateStudyDetector - Antiduplicación de estudios (subtarea 3.2, T-26);
   *   provisto directo, sin importar `ClinicalModule` (patrón `DeclaredCoveragesReader`).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly claimRepo: ClaimReadRepository,
    private readonly practiceLookup: PracticeTenantLookupService,
    private readonly duplicateStudyDetector: DuplicateStudyDetector,
  ) {}

  /**
   * Página de solicitudes enviadas por la organización activa.
   *
   * @param query - Filtros y paginación.
   * @returns Las filas de la página y el cursor de la siguiente.
   * @throws ForbiddenException si la organización no tiene prácticas activas.
   */
  async listClaims(query: ClaimListQueryDto): Promise<ClaimListResponseDto> {
    const em = this.em.fork();
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const { practiceIds, diagnosticUnitIds } =
      await this.providerScopeInScope();

    const filters: ClaimListFilters = {
      statusConceptId: query.statusConceptId,
      insuranceCarrierId: query.insuranceCarrierId,
      submittedFrom: this.parseDate(query.submittedFrom),
      submittedTo: this.parseDate(query.submittedTo),
    };
    const cursor = query.cursor
      ? (decodeKeysetCursor(query.cursor) as unknown as ClaimCursor)
      : null;

    const rows = await this.claimRepo.findClaimsPage(
      em,
      practiceIds,
      filters,
      limit,
      cursor,
      diagnosticUnitIds,
    );
    // La fila de sondeo se descarta: existía para saber si hay siguiente, no
    // para mostrarse.
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    if (page.length === 0) return { items: [], nextCursor: null };

    const items = await this.buildRows(em, page);
    const last = page[page.length - 1];
    const nextCursor = hasMore
      ? encodeKeysetCursor({
          submittedAt: last.submittedAt?.toISOString() ?? null,
          id: last.id,
        })
      : null;

    return { items, nextCursor };
  }

  /**
   * Detalle de una solicitud: cabecera, ítems, dictámenes y disputas.
   *
   * @param id - Solicitud consultada.
   * @returns El detalle completo.
   * @throws ForbiddenException si no la envió la organización activa, o no existe.
   */
  async getClaim(id: string): Promise<ClaimDetailDto> {
    const em = this.em.fork();

    const { practiceIds, diagnosticUnitIds } =
      await this.providerScopeInScope();
    const claim = await this.claimRepo.findClaimInScope(
      em,
      practiceIds,
      id,
      diagnosticUnitIds,
    );
    if (!claim) {
      // Mismo cuerpo que un uuid inexistente, y **sin detalles** (AC-16-14).
      throw this.accessDenied();
    }

    const [lines, versions, disputes] = await Promise.all([
      this.claimRepo.findLinesByClaimIds(em, [claim.id]),
      this.claimRepo.findAdjudicationsByClaimIds(em, [claim.id]),
      this.claimRepo.findDisputesByClaimIds(em, [claim.id]),
    ]);

    const current = this.currentVersion(versions);
    const byLine = current
      ? await this.claimRepo.findLineAdjudications(em, [current.id])
      : [];

    const concepts = await this.conceptMap(em, [
      claim.statusConceptId,
      claim.currencyConceptId,
      ...lines.map((line) => line.serviceConceptId),
      ...versions.map((version) => version.outcomeConceptId),
      ...byLine.flatMap((adj) => [adj.decisionConceptId, adj.reasonConceptId]),
      ...disputes.flatMap((dispute) => [
        dispute.disputeTypeConceptId,
        dispute.disputeReasonConceptId,
        dispute.statusConceptId,
      ]),
    ]);

    const [header] = await this.buildRows(em, [claim], concepts);
    const currency = concepts.get(claim.currencyConceptId ?? '') ?? null;
    const adjByLine = new Map(
      byLine.map((adj) => [adj.insuranceClaimLineId, adj]),
    );

    const duplicateStudy = await this.resolveDuplicateStudy(em, claim);
    const items = lines.map((line) =>
      this.buildLine(
        line,
        adjByLine.get(line.id),
        concepts,
        currency,
        duplicateStudy,
      ),
    );

    const billed = sumarDecimales(lines.map((line) => line.billedAmount));
    const approved = sumarDecimales(
      lines.map((line) => adjByLine.get(line.id)?.approvedAmount ?? null),
    );

    return {
      header,
      lines: items,
      lineBilledTotal: { amount: billed ?? '0', currency },
      lineApprovedTotal:
        approved === null ? null : { amount: approved, currency },
      adjudication: current
        ? this.buildAdjudication(current, concepts, currency)
        : null,
      adjudicationHistory: versions.map((version) =>
        this.buildAdjudication(version, concepts, currency),
      ),
      disputes: disputes.map((dispute) => this.buildDispute(dispute, concepts)),
    };
  }

  /**
   * Las prácticas activas de la organización activa, o el rechazo.
   *
   * Una organización sin prácticas activas no envió ninguna solicitud, y
   * AC-16-14 pide **403 en el listado y en el detalle** para una sesión sin
   * relación con la solicitud — no una lista vacía, que se leería como «no hay
   * solicitudes» en vez de «esta pantalla no es tuya».
   *
   * @returns Los ids de práctica que acotan toda consulta de esta cara.
   * @throws ForbiddenException si la organización no tiene prácticas activas.
   */
  private async practiceIdsInScope(): Promise<string[]> {
    const tenantId = requireTenantId();
    const practiceIds =
      await this.practiceLookup.findActivePracticeIdsForTenant(tenantId);
    if (practiceIds.length === 0) throw this.accessDenied();
    return practiceIds;
  }

  /**
   * El alcance completo del prestador activo: prácticas (reclamos de
   * atención) y unidades diagnósticas (reclamos vinculados a una orden de
   * laboratorio/imagen — antiduplicación, subtarea 3.2). Sin esto, un
   * reclamo que una unidad diagnóstica presentó nunca era legible: la lectura
   * sólo miraba `billing_provider_type = PRACTICE`.
   *
   * @returns Prácticas y unidades activas de la organización activa.
   * @throws ForbiddenException si la organización no tiene ninguna de las dos.
   */
  private async providerScopeInScope(): Promise<{
    practiceIds: string[];
    diagnosticUnitIds: string[];
  }> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const [practiceIds, units] = await Promise.all([
      this.practiceLookup.findActivePracticeIdsForTenant(tenantId),
      em.find(DiagnosticUnits, {
        tenantId,
        statusConceptId: DUNIT.UNIT_ACTIVE,
      }),
    ]);
    const diagnosticUnitIds = units.map((unit) => unit.id);
    if (practiceIds.length === 0 && diagnosticUnitIds.length === 0) {
      throw this.accessDenied();
    }
    return { practiceIds, diagnosticUnitIds };
  }

  /**
   * El rechazo único de esta cara.
   *
   * @returns La excepción, siempre con el mismo cuerpo y sin `details`.
   */
  private accessDenied(): ForbiddenException {
    return new ForbiddenException(CLAIM_ACCESS_DENIED);
  }

  /**
   * Arma las filas del listado resolviendo aseguradora, paciente y dictamen.
   *
   * Todo se pide **por lote**: una consulta por tabla y no una por fila. Con
   * veinticinco solicitudes en pantalla, resolver el paciente fila por fila son
   * cincuenta viajes a la base para pintar una tabla.
   *
   * @param em - Contexto de persistencia.
   * @param claims - Solicitudes de la página.
   * @param knownConcepts - Conceptos ya resueltos, si los hay.
   * @returns Las filas listas para la pantalla.
   */
  private async buildRows(
    em: EntityManager,
    claims: readonly InsuranceClaims[],
    knownConcepts?: Map<string, InsuranceConceptDto>,
  ): Promise<ClaimListItemDto[]> {
    const claimIds = claims.map((claim) => claim.id);
    const [carriers, coverages, versions, disputes] = await Promise.all([
      this.claimRepo.findCarriersByIds(
        em,
        unique(claims.map((claim) => claim.insuranceCarrierId)),
      ),
      this.claimRepo.findCoveragesByIds(
        em,
        unique(claims.map((claim) => claim.patientCoverageId)),
      ),
      this.claimRepo.findAdjudicationsByClaimIds(em, claimIds),
      this.claimRepo.findDisputesByClaimIds(em, claimIds),
    ]);

    const personIds = unique(
      coverages.map((coverage) => coverage.patientProfileId),
    );
    const brokerIds = unique(
      coverages.map((coverage) => coverage.insuranceBrokerId),
    );

    const [persons, profiles, brokers] = await Promise.all([
      personIds.length > 0
        ? em.find(Persons, { id: { $in: personIds } })
        : Promise.resolve([]),
      personIds.length > 0
        ? em.find(PatientProfiles, { profileId: { $in: personIds } })
        : Promise.resolve([]),
      brokerIds.length > 0
        ? em.find(InsuranceBrokersEntity, { id: { $in: brokerIds } })
        : Promise.resolve([]),
    ]);

    const concepts =
      knownConcepts ??
      (await this.conceptMap(em, [
        ...claims.map((claim) => claim.statusConceptId),
        ...claims.map((claim) => claim.currencyConceptId),
      ]));

    const carrierById = new Map(carriers.map((c) => [c.id, c]));
    const coverageById = new Map(coverages.map((c) => [c.id, c]));
    const personById = new Map(persons.map((p) => [p.id, p]));
    const profileById = new Map(profiles.map((p) => [p.profileId, p]));
    const brokerById = new Map(brokers.map((b) => [b.id, b]));

    // La versión vigente por solicitud: las versiones vienen ordenadas de la
    // más nueva a la más vieja, así que la primera de cada grupo es la que
    // manda.
    const currentByClaim = new Map<string, ClaimAdjudicationVersions>();
    for (const version of versions) {
      if (!currentByClaim.has(version.insuranceClaimId)) {
        currentByClaim.set(version.insuranceClaimId, version);
      }
    }
    const withOpenDispute = new Set(
      disputes
        .filter((dispute) => dispute.statusConceptId !== INS.DISPUTE_RESOLVED)
        .map((dispute) => dispute.insuranceClaimId),
    );

    return claims.map((claim) => {
      const carrier = carrierById.get(claim.insuranceCarrierId);
      const coverage = coverageById.get(claim.patientCoverageId);
      const person = coverage
        ? personById.get(coverage.patientProfileId)
        : undefined;
      const profile = coverage
        ? profileById.get(coverage.patientProfileId)
        : undefined;
      const broker = coverage?.insuranceBrokerId
        ? brokerById.get(coverage.insuranceBrokerId)
        : undefined;
      const currency = concepts.get(claim.currencyConceptId ?? '') ?? null;
      const current = currentByClaim.get(claim.id);

      return {
        id: claim.id,
        claimIdentifier: claim.claimIdentifier,
        patient: {
          id: coverage?.patientProfileId ?? '',
          displayName: person?.displayName ?? null,
          patientCode: profile?.patientCode ?? null,
          memberIdentifier: coverage?.memberIdentifier ?? null,
        },
        carrierName: carrier?.legalName ?? '',
        insuranceCarrierId: claim.insuranceCarrierId,
        carrierWhatsappNumber: carrier?.whatsappNumber ?? null,
        carrierCallCenterPhone: carrier?.callCenterPhone ?? null,
        carrierSupportEmail: carrier?.supportEmail ?? null,
        policyIdentifier: coverage?.policyIdentifier ?? null,
        policyBrokerName: this.brokerName(broker),
        billedTotal: { amount: claim.totalAmount ?? '0', currency },
        approvedTotal: this.money(current?.totalApprovedAmount, currency),
        submittedAt: claim.submittedAt?.toISOString() ?? null,
        status: concepts.get(claim.statusConceptId) ?? null,
        hasOpenDispute: withOpenDispute.has(claim.id),
      };
    });
  }

  /**
   * Arma un ítem con su dictamen, si lo tiene.
   *
   * @param line - El ítem facturado.
   * @param adj - Su adjudicación en la versión vigente, si existe.
   * @param concepts - Conceptos ya resueltos.
   * @param currency - Moneda de la solicitud.
   * @returns El ítem listo para la pantalla.
   */
  private buildLine(
    line: InsuranceClaimLines,
    adj: ClaimLineAdjudications | undefined,
    concepts: Map<string, InsuranceConceptDto>,
    currency: InsuranceConceptDto | null,
    duplicateStudy: ClaimLineDuplicateStudyDto | null,
  ): ClaimLineViewDto {
    const { referenceType, reference } = this.clinicalOrigin(line);
    return {
      id: line.id,
      lineSequence: line.lineSequence,
      service: concepts.get(line.serviceConceptId ?? '') ?? null,
      billedAmount: { amount: line.billedAmount ?? '0', currency },
      patientResponsibilityAmount: this.money(
        line.patientResponsibilityAmount,
        currency,
      ),
      approvedAmount: this.money(adj?.approvedAmount, currency),
      deniedAmount: this.money(adj?.deniedAmount, currency),
      decision: concepts.get(adj?.decisionConceptId ?? '') ?? null,
      denialReason: concepts.get(adj?.reasonConceptId ?? '') ?? null,
      policyClauseReference: adj?.policyClauseReference ?? null,
      denialRationale: adj?.denialRationale ?? null,
      referenceType,
      reference,
      duplicateStudy,
    };
  }

  /**
   * El estudio duplicado que originó la orden de esta solicitud, si tiene una
   * y está enlazada a un informe previo (antiduplicación, subtarea 3.2). La
   * aseguradora/facturación nunca ve la conclusión clínica: `includeConclusion`
   * va en `false`. `daysAgo` se mide contra la fecha de la ORDEN, no contra
   * "hoy" — es lo que responde "cuántos días separaron el estudio previo del
   * pedido nuevo".
   *
   * @param em - Contexto de persistencia.
   * @param claim - La solicitud cuyo origen se resuelve.
   * @returns La descripción, o `null` si la solicitud no viene de una orden
   *   enlazada a un informe previo.
   */
  private async resolveDuplicateStudy(
    em: EntityManager,
    claim: InsuranceClaims,
  ): Promise<ClaimLineDuplicateStudyDto | null> {
    if (!claim.serviceRequestId) return null;
    const order = await em.findOne(ServiceRequests, {
      id: claim.serviceRequestId,
    });
    if (!order?.previousDiagnosticReportId) return null;

    const tenantId = requireTenantId();
    const description = await this.duplicateStudyDetector.describeByReportId(
      em,
      order.previousDiagnosticReportId,
      tenantId,
      order.createdAt,
      false,
    );
    if (!description) return null;

    return {
      previousDiagnosticReportId: description.reportId,
      studyName: description.studyName,
      performedAt: description.performedAt,
      daysAgo: description.daysAgo,
      providerName: description.providerName,
      justification: order.duplicateOverrideReason ?? null,
      reused: order.duplicateOverrideReason === undefined,
    };
  }

  /**
   * Qué documento clínico respalda un ítem.
   *
   * **El tipo se declara sólo cuando el modelo lo sabe.** Hay FK a la oferta de
   * estudio diagnóstico y a la línea de dispensación, y nada más: la atención
   * cuelga de la solicitud, no del ítem, y no existe FK a la solicitud de
   * imagen, a la receta ni a «otro procedimiento». Cuando el ítem se apoya en
   * `supporting_clinical_reference` —un `varchar` sin integridad referencial—
   * se devuelve el texto con el tipo en `null`, para que la pantalla diga que
   * el tipo no está registrado en vez de adivinarlo.
   *
   * @param line - El ítem facturado.
   * @returns El tipo y el identificador de origen.
   */
  private clinicalOrigin(line: InsuranceClaimLines): {
    referenceType: ClaimLineViewDto['referenceType'];
    reference: string | null;
  } {
    if (line.diagnosticStudyOfferingId) {
      return {
        referenceType: 'DIAGNOSTIC_STUDY',
        reference: line.diagnosticStudyOfferingId,
      };
    }
    if (line.medicationDispensationLineId) {
      return {
        referenceType: 'MEDICATION_DISPENSATION',
        reference: line.medicationDispensationLineId,
      };
    }
    return {
      referenceType: null,
      reference: line.supportingClinicalReference ?? null,
    };
  }

  /**
   * Arma una versión de adjudicación.
   *
   * @param version - La versión leída.
   * @param concepts - Conceptos ya resueltos.
   * @param currency - Moneda de la solicitud.
   * @returns El dictamen listo para la pantalla.
   */
  private buildAdjudication(
    version: ClaimAdjudicationVersions,
    concepts: Map<string, InsuranceConceptDto>,
    currency: InsuranceConceptDto | null,
  ): ClaimAdjudicationDto {
    return {
      id: version.id,
      adjudicationVersion: version.adjudicationVersion,
      outcome: concepts.get(version.outcomeConceptId ?? '') ?? null,
      dispositionText: version.dispositionText ?? null,
      totalApprovedAmount: this.money(version.totalApprovedAmount, currency),
      totalPatientAmount: this.money(version.totalPatientAmount, currency),
      totalDeniedAmount: this.money(version.totalDeniedAmount, currency),
      adjudicatedAt: version.adjudicatedAt.toISOString(),
    };
  }

  /**
   * Arma el resumen de una disputa.
   *
   * @param dispute - La disputa leída.
   * @param concepts - Conceptos ya resueltos.
   * @returns El resumen listo para la pantalla.
   */
  private buildDispute(
    dispute: ClaimDisputes,
    concepts: Map<string, InsuranceConceptDto>,
  ): ClaimDisputeSummaryDto {
    return {
      id: dispute.id,
      disputeType: concepts.get(dispute.disputeTypeConceptId ?? '') ?? null,
      disputeReason: concepts.get(dispute.disputeReasonConceptId ?? '') ?? null,
      status: concepts.get(dispute.statusConceptId) ?? null,
      submittedAt: dispute.submittedAt?.toISOString() ?? null,
      filingDeadline: dispute.filingDeadline
        ? dateOnly(dispute.filingDeadline)
        : null,
    };
  }

  /**
   * La versión de adjudicación que manda.
   *
   * Es la que **nadie sucede**: `supersedes_version_id` apunta hacia atrás, así
   * que la vigente es la que no figura como superada por ninguna otra. Tomar
   * simplemente la de número más alto funcionaría hoy y dejaría de funcionar el
   * día que se inserte una corrección fuera de orden.
   *
   * @param versions - Todas las versiones de la solicitud.
   * @returns La vigente, o `undefined` si no hay ninguna.
   */
  private currentVersion(
    versions: readonly ClaimAdjudicationVersions[],
  ): ClaimAdjudicationVersions | undefined {
    if (versions.length === 0) return undefined;
    const superseded = new Set(
      versions
        .map((version) => version.supersedesVersionId)
        .filter((id): id is string => id != null),
    );
    return (
      versions.find((version) => !superseded.has(version.id)) ?? versions[0]
    );
  }

  /**
   * Resuelve una lista de ids de concepto a su par legible.
   *
   * @param em - Contexto de persistencia.
   * @param ids - Ids, con nulos y repetidos.
   * @returns Mapa de id a concepto.
   */
  private async conceptMap(
    em: EntityManager,
    ids: ReadonlyArray<string | null | undefined>,
  ): Promise<Map<string, InsuranceConceptDto>> {
    const clean = unique(ids);
    if (clean.length === 0) return new Map();
    const concepts = await em.find(CatalogConcepts, { id: { $in: clean } });
    return new Map(
      concepts.map((concept) => [
        concept.id,
        { code: concept.code, display: concept.display },
      ]),
    );
  }

  /**
   * Envuelve un importe con su moneda, o devuelve `null`.
   *
   * `null` y `'0.00'` no son lo mismo: uno es «todavía no hay dictamen» y el
   * otro «el dictamen aprobó cero». Confundirlos es un error contable, así que
   * la ausencia se propaga tal cual hasta la pantalla.
   *
   * @param amount - Importe crudo de la base, o nulo.
   * @param currency - Moneda de la solicitud.
   * @returns El importe con su moneda, o `null`.
   */
  private money(
    amount: string | null | undefined,
    currency: InsuranceConceptDto | null,
  ): MoneyDto | null {
    if (amount == null || amount === '') return null;
    return { amount, currency };
  }

  /**
   * Nombre visible de un corredor.
   *
   * @param broker - El corredor, si la póliza declara uno.
   * @returns Su razón social, o `null`.
   */
  private brokerName(broker: InsuranceBrokers | undefined): string | null {
    if (!broker) return null;
    return broker.legalName ?? broker.brokerCode ?? null;
  }

  /**
   * Convierte un ISO de la consulta a `Date`.
   *
   * @param text - Fecha en ISO 8601, si vino.
   * @returns La fecha, o `undefined`.
   */
  private parseDate(text: string | undefined): Date | undefined {
    if (!text) return undefined;
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}

/**
 * Quita nulos y repetidos de una lista de ids.
 *
 * @param ids - Ids con nulos y repetidos.
 * @returns Los ids presentes, una vez cada uno.
 */
function unique(ids: ReadonlyArray<string | null | undefined>): string[] {
  return [
    ...new Set(ids.filter((id): id is string => id != null && id !== '')),
  ];
}

/**
 * Recorta un `Date` a su parte de fecha, en ISO.
 *
 * Una fecha límite de presentación es un día, no un instante: emitirla con
 * hora invita a que el cliente la interprete en su zona y muestre el día de
 * antes.
 *
 * @param date - La fecha leída.
 * @returns `YYYY-MM-DD`.
 */
function dateOnly(date: Date | string): string {
  const text = typeof date === 'string' ? date : date.toISOString();
  return text.slice(0, 10);
}
