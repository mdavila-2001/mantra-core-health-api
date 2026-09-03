import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  requireTenantId,
  ResourceNotFoundException,
  sumarDecimales,
} from '../../../common';
import { CatalogConcepts } from '../../terminology/entities';
import { Persons, PatientProfiles } from '../../profiles/entities';
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
const LIMITE_POR_DEFECTO = 25;

/**
 * Lectura de solicitudes de seguro presentadas: listado y detalle.
 *
 * El módulo 26 tenía once controladores y **ninguna lectura de solicitudes**:
 * se podía presentar un reclamo, adjudicarlo, revertirlo y disputarlo, y no
 * había forma de volver a verlo. Esto agrega esa cara; no relaja ninguna
 * escritura.
 *
 * Tres reglas gobiernan todo lo de acá:
 *
 * - **Aislamiento en la raíz.** La solicitud no tiene `tenant_id`: cuelga de la
 *   aseguradora. Toda consulta arranca por las aseguradoras del tenant activo,
 *   y una solicitud de otra organización es indistinguible de una inexistente.
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
   */
  constructor(
    private readonly em: EntityManager,
    private readonly claimRepo: ClaimReadRepository,
  ) {}

  /**
   * Página de solicitudes del tenant activo.
   *
   * @param query - Filtros y paginación.
   * @returns Las filas de la página y el cursor de la siguiente.
   */
  async listClaims(query: ClaimListQueryDto): Promise<ClaimListResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const limite = query.limit ?? LIMITE_POR_DEFECTO;

    const carrierIds = await this.claimRepo.findCarrierIdsByTenant(
      em,
      tenantId,
    );
    if (carrierIds.length === 0) return { items: [], nextCursor: null };

    const filtros: ClaimListFilters = {
      statusConceptId: query.statusConceptId,
      insuranceCarrierId: query.insuranceCarrierId,
      submittedFrom: this.fecha(query.submittedFrom),
      submittedTo: this.fecha(query.submittedTo),
    };
    const cursor = query.cursor
      ? (decodeKeysetCursor(query.cursor) as unknown as ClaimCursor)
      : null;

    const filas = await this.claimRepo.findClaimsPage(
      em,
      carrierIds,
      filtros,
      limite,
      cursor,
    );
    // La fila de sondeo se descarta: existía para saber si hay siguiente, no
    // para mostrarse.
    const hayMas = filas.length > limite;
    const pagina = hayMas ? filas.slice(0, limite) : filas;
    if (pagina.length === 0) return { items: [], nextCursor: null };

    const items = await this.armarFilas(em, pagina);
    const ultima = pagina[pagina.length - 1];
    const nextCursor = hayMas
      ? encodeKeysetCursor({
          submittedAt: ultima.submittedAt?.toISOString() ?? null,
          id: ultima.id,
        })
      : null;

    return { items, nextCursor };
  }

  /**
   * Detalle de una solicitud: cabecera, ítems, dictámenes y disputas.
   *
   * @param id - Solicitud consultada.
   * @returns El detalle completo.
   * @throws ResourceNotFoundException si no está en el alcance del tenant.
   */
  async getClaim(id: string): Promise<ClaimDetailDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();

    const carrierIds = await this.claimRepo.findCarrierIdsByTenant(
      em,
      tenantId,
    );
    const claim = await this.claimRepo.findClaimInScope(em, carrierIds, id);
    if (!claim) {
      // Mismo cuerpo que un uuid inexistente, y **sin detalles**: si el id
      // viajara en `details`, «no es tuya» y «no existe» dejarían de ser
      // indistinguibles y el 404 volvería a servir de sonda (AC-16-14).
      throw new ResourceNotFoundException('Solicitud de seguro no encontrada');
    }

    const [lineas, versiones, disputas] = await Promise.all([
      this.claimRepo.findLinesByClaimIds(em, [claim.id]),
      this.claimRepo.findAdjudicationsByClaimIds(em, [claim.id]),
      this.claimRepo.findDisputesByClaimIds(em, [claim.id]),
    ]);

    const vigente = this.versionVigente(versiones);
    const porLinea = vigente
      ? await this.claimRepo.findLineAdjudications(em, [vigente.id])
      : [];

    const conceptos = await this.mapaDeConceptos(em, [
      claim.statusConceptId,
      claim.currencyConceptId,
      ...lineas.map((linea) => linea.serviceConceptId),
      ...versiones.map((version) => version.outcomeConceptId),
      ...porLinea.flatMap((adj) => [
        adj.decisionConceptId,
        adj.reasonConceptId,
      ]),
      ...disputas.flatMap((disputa) => [
        disputa.disputeTypeConceptId,
        disputa.disputeReasonConceptId,
        disputa.statusConceptId,
      ]),
    ]);

    const [cabecera] = await this.armarFilas(em, [claim], conceptos);
    const moneda = conceptos.get(claim.currencyConceptId ?? '') ?? null;
    const adjPorLinea = new Map(
      porLinea.map((adj) => [adj.insuranceClaimLineId, adj]),
    );

    const items = lineas.map((linea) =>
      this.armarLinea(linea, adjPorLinea.get(linea.id), conceptos, moneda),
    );

    const facturado = sumarDecimales(lineas.map((linea) => linea.billedAmount));
    const aprobado = sumarDecimales(
      lineas.map((linea) => adjPorLinea.get(linea.id)?.approvedAmount ?? null),
    );

    return {
      header: cabecera,
      lines: items,
      lineBilledTotal: { amount: facturado ?? '0', currency: moneda },
      lineApprovedTotal:
        aprobado === null ? null : { amount: aprobado, currency: moneda },
      adjudication: vigente
        ? this.armarAdjudicacion(vigente, conceptos, moneda)
        : null,
      adjudicationHistory: versiones.map((version) =>
        this.armarAdjudicacion(version, conceptos, moneda),
      ),
      disputes: disputas.map((disputa) =>
        this.armarDisputa(disputa, conceptos),
      ),
    };
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
   * @param conceptosPrevios - Conceptos ya resueltos, si los hay.
   * @returns Las filas listas para la pantalla.
   */
  private async armarFilas(
    em: EntityManager,
    claims: readonly InsuranceClaims[],
    conceptosPrevios?: Map<string, InsuranceConceptDto>,
  ): Promise<ClaimListItemDto[]> {
    const claimIds = claims.map((claim) => claim.id);
    const [carriers, coverages, versiones, disputas] = await Promise.all([
      this.claimRepo.findCarriersByIds(
        em,
        unicos(claims.map((claim) => claim.insuranceCarrierId)),
      ),
      this.claimRepo.findCoveragesByIds(
        em,
        unicos(claims.map((claim) => claim.patientCoverageId)),
      ),
      this.claimRepo.findAdjudicationsByClaimIds(em, claimIds),
      this.claimRepo.findDisputesByClaimIds(em, claimIds),
    ]);

    const personIds = unicos(
      coverages.map((coverage) => coverage.patientProfileId),
    );
    const brokerIds = unicos(
      coverages.map((coverage) => coverage.insuranceBrokerId),
    );

    const [personas, perfiles, brokers] = await Promise.all([
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

    const conceptos =
      conceptosPrevios ??
      (await this.mapaDeConceptos(em, [
        ...claims.map((claim) => claim.statusConceptId),
        ...claims.map((claim) => claim.currencyConceptId),
      ]));

    const carrierPorId = new Map(carriers.map((c) => [c.id, c]));
    const coveragePorId = new Map(coverages.map((c) => [c.id, c]));
    const personaPorId = new Map(personas.map((p) => [p.id, p]));
    const perfilPorId = new Map(perfiles.map((p) => [p.profileId, p]));
    const brokerPorId = new Map(brokers.map((b) => [b.id, b]));

    // La versión vigente por solicitud: las versiones vienen ordenadas de la
    // más nueva a la más vieja, así que la primera de cada grupo es la que
    // manda.
    const vigentePorClaim = new Map<string, ClaimAdjudicationVersions>();
    for (const version of versiones) {
      if (!vigentePorClaim.has(version.insuranceClaimId)) {
        vigentePorClaim.set(version.insuranceClaimId, version);
      }
    }
    const conDisputaAbierta = new Set(
      disputas
        .filter((disputa) => disputa.statusConceptId !== INS.DISPUTE_RESOLVED)
        .map((disputa) => disputa.insuranceClaimId),
    );

    return claims.map((claim) => {
      const carrier = carrierPorId.get(claim.insuranceCarrierId);
      const coverage = coveragePorId.get(claim.patientCoverageId);
      const persona = coverage
        ? personaPorId.get(coverage.patientProfileId)
        : undefined;
      const perfil = coverage
        ? perfilPorId.get(coverage.patientProfileId)
        : undefined;
      const broker = coverage?.insuranceBrokerId
        ? brokerPorId.get(coverage.insuranceBrokerId)
        : undefined;
      const moneda = conceptos.get(claim.currencyConceptId ?? '') ?? null;
      const vigente = vigentePorClaim.get(claim.id);

      return {
        id: claim.id,
        claimIdentifier: claim.claimIdentifier,
        patient: {
          id: coverage?.patientProfileId ?? '',
          displayName: persona?.displayName ?? null,
          patientCode: perfil?.patientCode ?? null,
          memberIdentifier: coverage?.memberIdentifier ?? null,
        },
        carrierName: carrier?.legalName ?? '',
        insuranceCarrierId: claim.insuranceCarrierId,
        policyIdentifier: coverage?.policyIdentifier ?? null,
        policyBrokerName: this.nombreDeBroker(broker),
        billedTotal: { amount: claim.totalAmount ?? '0', currency: moneda },
        approvedTotal: this.dinero(vigente?.totalApprovedAmount, moneda),
        submittedAt: claim.submittedAt?.toISOString() ?? null,
        status: conceptos.get(claim.statusConceptId) ?? null,
        hasOpenDispute: conDisputaAbierta.has(claim.id),
      };
    });
  }

  /**
   * Arma un ítem con su dictamen, si lo tiene.
   *
   * @param linea - El ítem facturado.
   * @param adj - Su adjudicación en la versión vigente, si existe.
   * @param conceptos - Conceptos ya resueltos.
   * @param moneda - Moneda de la solicitud.
   * @returns El ítem listo para la pantalla.
   */
  private armarLinea(
    linea: InsuranceClaimLines,
    adj: ClaimLineAdjudications | undefined,
    conceptos: Map<string, InsuranceConceptDto>,
    moneda: InsuranceConceptDto | null,
  ): ClaimLineViewDto {
    const { referenceType, reference } = this.origenClinico(linea);
    return {
      id: linea.id,
      lineSequence: linea.lineSequence,
      service: conceptos.get(linea.serviceConceptId ?? '') ?? null,
      billedAmount: { amount: linea.billedAmount ?? '0', currency: moneda },
      patientResponsibilityAmount: this.dinero(
        linea.patientResponsibilityAmount,
        moneda,
      ),
      approvedAmount: this.dinero(adj?.approvedAmount, moneda),
      deniedAmount: this.dinero(adj?.deniedAmount, moneda),
      decision: conceptos.get(adj?.decisionConceptId ?? '') ?? null,
      denialReason: conceptos.get(adj?.reasonConceptId ?? '') ?? null,
      referenceType,
      reference,
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
   * @param linea - El ítem facturado.
   * @returns El tipo y el identificador de origen.
   */
  private origenClinico(linea: InsuranceClaimLines): {
    referenceType: ClaimLineViewDto['referenceType'];
    reference: string | null;
  } {
    if (linea.diagnosticStudyOfferingId) {
      return {
        referenceType: 'DIAGNOSTIC_STUDY',
        reference: linea.diagnosticStudyOfferingId,
      };
    }
    if (linea.medicationDispensationLineId) {
      return {
        referenceType: 'MEDICATION_DISPENSATION',
        reference: linea.medicationDispensationLineId,
      };
    }
    return {
      referenceType: null,
      reference: linea.supportingClinicalReference ?? null,
    };
  }

  /**
   * Arma una versión de adjudicación.
   *
   * @param version - La versión leída.
   * @param conceptos - Conceptos ya resueltos.
   * @param moneda - Moneda de la solicitud.
   * @returns El dictamen listo para la pantalla.
   */
  private armarAdjudicacion(
    version: ClaimAdjudicationVersions,
    conceptos: Map<string, InsuranceConceptDto>,
    moneda: InsuranceConceptDto | null,
  ): ClaimAdjudicationDto {
    return {
      id: version.id,
      adjudicationVersion: version.adjudicationVersion,
      outcome: conceptos.get(version.outcomeConceptId ?? '') ?? null,
      dispositionText: version.dispositionText ?? null,
      totalApprovedAmount: this.dinero(version.totalApprovedAmount, moneda),
      totalPatientAmount: this.dinero(version.totalPatientAmount, moneda),
      totalDeniedAmount: this.dinero(version.totalDeniedAmount, moneda),
      adjudicatedAt: version.adjudicatedAt.toISOString(),
    };
  }

  /**
   * Arma el resumen de una disputa.
   *
   * @param disputa - La disputa leída.
   * @param conceptos - Conceptos ya resueltos.
   * @returns El resumen listo para la pantalla.
   */
  private armarDisputa(
    disputa: ClaimDisputes,
    conceptos: Map<string, InsuranceConceptDto>,
  ): ClaimDisputeSummaryDto {
    return {
      id: disputa.id,
      disputeType: conceptos.get(disputa.disputeTypeConceptId ?? '') ?? null,
      disputeReason:
        conceptos.get(disputa.disputeReasonConceptId ?? '') ?? null,
      status: conceptos.get(disputa.statusConceptId) ?? null,
      submittedAt: disputa.submittedAt?.toISOString() ?? null,
      filingDeadline: disputa.filingDeadline
        ? fechaSola(disputa.filingDeadline)
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
   * @param versiones - Todas las versiones de la solicitud.
   * @returns La vigente, o `undefined` si no hay ninguna.
   */
  private versionVigente(
    versiones: readonly ClaimAdjudicationVersions[],
  ): ClaimAdjudicationVersions | undefined {
    if (versiones.length === 0) return undefined;
    const superadas = new Set(
      versiones
        .map((version) => version.supersedesVersionId)
        .filter((id): id is string => id != null),
    );
    return (
      versiones.find((version) => !superadas.has(version.id)) ?? versiones[0]
    );
  }

  /**
   * Resuelve una lista de ids de concepto a su par legible.
   *
   * @param em - Contexto de persistencia.
   * @param ids - Ids, con nulos y repetidos.
   * @returns Mapa de id a concepto.
   */
  private async mapaDeConceptos(
    em: EntityManager,
    ids: ReadonlyArray<string | null | undefined>,
  ): Promise<Map<string, InsuranceConceptDto>> {
    const limpios = unicos(ids);
    if (limpios.length === 0) return new Map();
    const conceptos = await em.find(CatalogConcepts, { id: { $in: limpios } });
    return new Map(
      conceptos.map((concepto) => [
        concepto.id,
        { code: concepto.code, display: concepto.display },
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
   * @param importe - Importe crudo de la base, o nulo.
   * @param moneda - Moneda de la solicitud.
   * @returns El importe con su moneda, o `null`.
   */
  private dinero(
    importe: string | null | undefined,
    moneda: InsuranceConceptDto | null,
  ): MoneyDto | null {
    if (importe == null || importe === '') return null;
    return { amount: importe, currency: moneda };
  }

  /**
   * Nombre visible de un corredor.
   *
   * @param broker - El corredor, si la póliza declara uno.
   * @returns Su razón social, o `null`.
   */
  private nombreDeBroker(broker: InsuranceBrokers | undefined): string | null {
    if (!broker) return null;
    return broker.legalName ?? broker.brokerCode ?? null;
  }

  /**
   * Convierte un ISO de la consulta a `Date`.
   *
   * @param texto - Fecha en ISO 8601, si vino.
   * @returns La fecha, o `undefined`.
   */
  private fecha(texto: string | undefined): Date | undefined {
    if (!texto) return undefined;
    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? undefined : fecha;
  }
}

/**
 * Quita nulos y repetidos de una lista de ids.
 *
 * @param ids - Ids con nulos y repetidos.
 * @returns Los ids presentes, una vez cada uno.
 */
function unicos(ids: ReadonlyArray<string | null | undefined>): string[] {
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
 * @param fecha - La fecha leída.
 * @returns `YYYY-MM-DD`.
 */
function fechaSola(fecha: Date | string): string {
  const texto = typeof fecha === 'string' ? fecha : fecha.toISOString();
  return texto.slice(0, 10);
}
