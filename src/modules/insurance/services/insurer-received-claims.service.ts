import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services';
import { OutboxService } from '../../messaging/services';
import { PatientProfiles, Persons } from '../../profiles/entities';
import { CatalogConcepts } from '../../terminology/entities';
import type {
  ClaimAdjudicationVersions,
  InsuranceClaimLines,
  InsuranceClaims,
} from '../entities';
import { INS } from '../insurance.concepts';
import {
  CatalogRepository,
  ClaimReadRepository,
  ClaimRepository,
} from '../repositories';
import type {
  ClaimPatientDto,
  InsuranceConceptDto,
  MoneyDto,
  ReceivedClaimDecisionDto,
  ReceivedClaimDecisionViewDto,
  ReceivedClaimDto,
  ReceivedClaimLineDto,
  ReceivedClaimListDto,
  ReceivedClaimOutcome,
  ReceivedClaimPractitionerDto,
} from '../dto';
import { LinkedClaimOrderService } from './linked-claim-order.service';
import { matchesLinkedClaimSnapshot } from './linked-claim-validation';
import type { MyClaimDto, MyClaimsView } from '../dto/my-claims.dto';
import {
  fromCents,
  splitApproval,
  toCents,
  type LineSettlement,
} from './received-claim-settlement';

/** Tope de filas del listado: por encima se recorta y se avisa con `truncated`. */
export const MAX_RECEIVED_CLAIMS = 500;

/** Mínimo de caracteres del motivo cuando el dictamen no aprueba todo. */
const MIN_REASON_LENGTH = 5;

/** Roles de negocio que pueden operar las solicitudes de una aseguradora sin ser OWNER/ADMIN. */
const INSURER_ROLES = ['INSURANCE_OPERATOR', 'SECURITY_ADMIN', 'SUPERADMIN'];

/** Evento que el dictamen favorable publica para la facturación. */
export const CLAIM_DECIDED_EVENT = 'InsuranceClaimDecided';

/** Tipo de agregado del evento: la tabla que cambió. */
const CLAIM_AGGREGATE = 'insurance.insurance_claims';

/** Bolivia no tiene horario de verano: `America/La_Paz` es un desfase fijo de −04:00. */
const LA_PAZ_OFFSET_MS = -4 * 60 * 60 * 1000;

/**
 * Rechazo único de esta cara: no es una aseguradora, o lo es y la sesión no
 * tiene permiso sobre ella. Un solo texto, para que el código de error no
 * diga qué organización es aseguradora.
 */
const ACCESS_DENIED = 'No hay acceso a las solicitudes recibidas';

/** Estado visible de una solicitud que todavía no tiene dictamen, o que ya se pagó o revirtió. */
const STATUS_BY_CLAIM_CONCEPT = new Map<string, InsuranceConceptDto>([
  [INS.CLAIM_SUBMITTED, { code: 'SUBMITTED', display: 'Enviada' }],
  [INS.CLAIM_PAID, { code: 'PAID', display: 'Pagada' }],
  [INS.CLAIM_REVERSED, { code: 'REVERSED', display: 'Revertida' }],
]);

/** Estado visible de una solicitud adjudicada, según el resultado del dictamen. */
const STATUS_BY_OUTCOME: Readonly<
  Record<ReceivedClaimOutcome, InsuranceConceptDto>
> = {
  APPROVED: { code: 'APPROVED', display: 'Aprobada' },
  PARTIAL: { code: 'PARTIAL', display: 'Aprobada parcialmente' },
  REJECTED: { code: 'REJECTED', display: 'Rechazada' },
};

/** Resultado del dictamen que cada concepto de adjudicación representa. */
const OUTCOME_BY_CONCEPT = new Map<string, ReceivedClaimOutcome>([
  [INS.ADJ_OUTCOME_APPROVED, 'APPROVED'],
  [INS.ADJ_OUTCOME_PARTIAL, 'PARTIAL'],
  [INS.ADJ_OUTCOME_DENIED, 'REJECTED'],
]);

/** Concepto de adjudicación que escribe cada resultado del dictamen. */
const CONCEPT_BY_OUTCOME: Readonly<Record<ReceivedClaimOutcome, string>> = {
  APPROVED: INS.ADJ_OUTCOME_APPROVED,
  PARTIAL: INS.ADJ_OUTCOME_PARTIAL,
  REJECTED: INS.ADJ_OUTCOME_DENIED,
};

/** Todo lo que hace falta para armar las filas, ya leído y por id. */
interface RowContext {
  readonly lines: Map<string, InsuranceClaimLines[]>;
  readonly currentVersion: Map<string, ClaimAdjudicationVersions>;
  readonly concepts: Map<string, InsuranceConceptDto>;
  readonly patients: Map<string, ClaimPatientDto>;
  readonly coverageOf: Map<string, { policy: string | null; planId: string }>;
  readonly planNames: Map<string, string>;
  readonly practitioners: Map<string, ReceivedClaimPractitionerDto>;
  readonly encounterOf: Map<
    string,
    { practitionerId: string | null; startAt: Date | null }
  >;
  readonly providerNames: Map<string, string>;
  readonly userNames: Map<string, string>;
}

/** Lo que el dictamen decide, ya validado y repartido entre líneas. */
interface DecisionPlan {
  readonly outcome: ReceivedClaimOutcome;
  readonly reason: string;
  readonly requestedCents: bigint;
  readonly approvedCents: bigint;
  readonly lines: readonly LineSettlement[];
}

/**
 * Solicitudes recibidas por una aseguradora y su dictamen (Hito 4 §A).
 *
 * La cara de **quien paga** del mismo `insurance_claims` que el prestador ve en
 * «Solicitudes de seguro» (`ClaimsReadService`). Aquélla acota por el
 * prestador que envió; ésta, por la aseguradora que recibe.
 *
 * ## Quién es la aseguradora
 *
 * Siempre sale del **tenant activo**, nunca de un parámetro del cliente: si el
 * cliente mandara un id de aseguradora sería un IDOR esperando pasar. Y la
 * autoridad sobre esa aseguradora es la membresía OWNER/ADMIN del tenant o un
 * rol de aseguradora **vigente en ese tenant**: un rol concedido en otra
 * organización no vale acá (`roleAuthorizesInTenant`).
 *
 * ## El dictamen es definitivo
 *
 * Sólo una solicitud `CLAIM_SUBMITTED` sin ninguna versión de adjudicación se
 * puede decidir; cualquier otra responde 409 `ALREADY_DECIDED`. La fila se
 * bloquea (`FOR UPDATE`) antes de mirar, así que dos dictámenes concurrentes no
 * pueden crear dos versiones 1. No existe ruta que lo revierta.
 *
 * Escribe lo mismo que `ClaimsService.adjudicate` —una versión inmutable y una
 * adjudicación por línea— y, para una solicitud enlazada a un pedido, vuelve a
 * comprobar que el pedido no cambió desde que se presentó.
 *
 * ## Por qué la factura no está
 *
 * El modelo no declara dónde vive la factura del prestador a la aseguradora
 * (`billing.invoices` exige práctica y paciente y no tiene anulación). Hasta
 * que eso se decida, el dictamen favorable publica `InsuranceClaimDecided` en
 * la misma transacción —el evento que la facturación consumirá— y `invoice`
 * viaja `null`.
 */
@Injectable()
export class InsurerReceivedClaimsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia raíz.
   * @param catalogRepo - Aseguradora de un tenant.
   * @param claimReadRepo - Lecturas por lote del ciclo del reclamo.
   * @param claimRepo - Escrituras y bloqueo del reclamo.
   * @param tenantAdministration - Si una sesión administra un tenant.
   * @param linkedOrders - Pedido de origen de una solicitud enlazada.
   * @param outbox - Publicación transaccional de eventos de dominio.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: CatalogRepository,
    private readonly claimReadRepo: ClaimReadRepository,
    private readonly claimRepo: ClaimRepository,
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly linkedOrders: LinkedClaimOrderService,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InsurerReceivedClaimsService.name);
  }

  /**
   * Las solicitudes que los prestadores le presentaron a la aseguradora activa.
   *
   * De la más reciente a la más vieja, con tope de {@link MAX_RECEIVED_CLAIMS}
   * y aviso de recorte: la pantalla es una lista local que busca, filtra y
   * pagina en el cliente, y un tope silencioso se leería como «no hay más».
   *
   * @param actor - La sesión que pregunta.
   * @returns Las solicitudes y si se recortó.
   * @throws ForbiddenException si la organización activa no es una aseguradora
   *   sobre la que la sesión tenga permiso.
   */
  async list(actor: AuthenticatedUser): Promise<ReceivedClaimListDto> {
    const em = this.em.fork();
    const { carrierId } = await this.resolveCarrier(em, actor);

    const rows = await this.claimReadRepo.findClaimsPage(
      em,
      [],
      {},
      MAX_RECEIVED_CLAIMS,
      null,
      [],
      carrierId,
    );
    const truncated = rows.length > MAX_RECEIVED_CLAIMS;
    const page = truncated ? rows.slice(0, MAX_RECEIVED_CLAIMS) : rows;
    return { items: await this.buildItems(em, page), truncated };
  }

  /**
   * Dictamina una solicitud: aprueba todo, aprueba una parte o rechaza.
   *
   * @param claimId - La solicitud.
   * @param dto - Resultado, monto (sólo parcial), motivo y cláusula.
   * @param actor - La sesión que dictamina.
   * @returns La solicitud completa, ya con su dictamen.
   * @throws ForbiddenException si no es una aseguradora sobre la que tenga permiso.
   * @throws ResourceNotFoundException si la solicitud no existe o es de otra aseguradora.
   * @throws ConflictException (409, `reason: ALREADY_DECIDED`) si ya tiene dictamen.
   * @throws PreconditionFailedException (422) si el monto o el motivo no son
   *   los que pide el resultado, o el pedido de origen cambió.
   */
  async decide(
    claimId: string,
    dto: ReceivedClaimDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<ReceivedClaimDto> {
    const { carrierId, tenantId } = await this.resolveCarrier(
      this.em.fork(),
      actor,
    );
    this.logger.info(
      {
        operation: 'insurance.received-claim.decide',
        claimId,
        outcome: dto.outcome,
      },
      'Deciding received claim',
    );

    await this.em.transactional(async (tx) => {
      const initial = await this.claimReadRepo.findClaimInScope(
        tx,
        [],
        claimId,
        [],
        carrierId,
      );
      if (!initial) throw this.claimNotFound();

      const lines = await this.claimReadRepo.findLinesByClaimIds(tx, [claimId]);
      // Orden de locks pedido → reclamo, el mismo de `ClaimsService`: un
      // dictamen sobre un pedido que cambió desde que se presentó liquidaría
      // dinero que ya no existe.
      if (initial.inventoryReservationId || initial.serviceRequestId) {
        const snapshot = await this.linkedOrders.lockAndResolve(tx, {
          ...initial,
          lines,
        });
        if (!matchesLinkedClaimSnapshot(initial, lines, snapshot)) {
          throw new PreconditionFailedException(
            'El pedido cambió; se requiere revisar el reclamo',
          );
        }
      }

      const claim = await this.claimRepo.findClaimForUpdate(tx, claimId);
      if (claim?.insuranceCarrierId !== carrierId) throw this.claimNotFound();

      const previous = await this.claimRepo.latestVersion(tx, claimId);
      if (claim.statusConceptId !== INS.CLAIM_SUBMITTED || previous) {
        throw new ConflictException(
          'La solicitud ya tiene dictamen y no se puede cambiar',
          { reason: 'ALREADY_DECIDED' },
        );
      }

      const plan = this.planDecision(claim, lines, dto);
      await this.writeDecision(tx, claim, plan, dto, actor);
      await this.publishDecision(tx, claim, plan, carrierId, tenantId, actor);
    });

    const em = this.em.fork();
    const fresh = await this.claimReadRepo.findClaimInScope(
      em,
      [],
      claimId,
      [],
      carrierId,
    );
    if (!fresh) throw this.claimNotFound();
    const [item] = await this.buildItems(em, [fresh]);
    return item;
  }

  /**
   * La aseguradora del tenant activo, si la sesión puede operarla.
   *
   * @param em - Contexto de persistencia.
   * @param actor - La sesión.
   * @returns Su id y el del tenant activo.
   * @throws ForbiddenException si el tenant no es una aseguradora o la sesión
   *   no es OWNER/ADMIN de ella ni tiene un rol de aseguradora en ese tenant.
   */
  private async resolveCarrier(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<{ carrierId: string; tenantId: string }> {
    const tenantId = requireTenantId();
    const carrier = await this.catalogRepo.findCarrierByTenantId(em, tenantId);
    if (!carrier) throw new ForbiddenException(ACCESS_DENIED);

    const canAdminister = await this.tenantAdministration.canAdminister(
      em,
      tenantId,
      actor,
    );
    const hasRole = INSURER_ROLES.some((role) =>
      roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (!canAdminister && !hasRole) throw new ForbiddenException(ACCESS_DENIED);
    return { carrierId: carrier.id, tenantId };
  }

  /**
   * El rechazo de una solicitud que no es de esta aseguradora, o no existe.
   *
   * @returns La excepción: la misma para las dos causas, sin el id.
   */
  private claimNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException('La solicitud no existe');
  }

  /**
   * Valida el dictamen contra la solicitud y reparte el monto entre líneas.
   *
   * @param claim - La solicitud bloqueada.
   * @param lines - Sus renglones.
   * @param dto - Lo que pidió el cliente.
   * @returns El dictamen listo para escribir.
   * @throws PreconditionFailedException (422) si algo no cuadra.
   */
  private planDecision(
    claim: InsuranceClaims,
    lines: readonly InsuranceClaimLines[],
    dto: ReceivedClaimDecisionDto,
  ): DecisionPlan {
    const fail = (message: string, field: string): never => {
      throw new PreconditionFailedException(message, {
        claimId: claim.id,
        field,
      });
    };

    const reason = dto.reason?.trim() ?? '';
    if (dto.outcome !== 'PARTIAL' && dto.approvedAmount !== undefined) {
      fail(
        'El monto aprobado sólo se indica al aprobar en parte',
        'approvedAmount',
      );
    }
    if (dto.outcome !== 'APPROVED' && reason.length < MIN_REASON_LENGTH) {
      fail(
        `Falta el motivo: al menos ${MIN_REASON_LENGTH} caracteres`,
        'reason',
      );
    }

    const requestedCents = this.requestedCents(claim, lines, fail);
    let approvedCents = 0n;
    if (dto.outcome === 'APPROVED') approvedCents = requestedCents;
    if (dto.outcome === 'PARTIAL') {
      approvedCents = this.partialCents(
        dto.approvedAmount,
        requestedCents,
        fail,
      );
    }

    try {
      return {
        outcome: dto.outcome,
        reason,
        requestedCents,
        approvedCents,
        lines: splitApproval(
          lines.map((line) => ({
            id: line.id,
            billedAmount: line.billedAmount ?? null,
          })),
          approvedCents,
        ),
      };
    } catch (error) {
      if (error instanceof RangeError) {
        return fail(
          'No se pudo repartir el monto entre los renglones',
          'lines',
        );
      }
      throw error;
    }
  }

  /**
   * Lo solicitado, en centavos, comprobando que los renglones lo respaldan.
   *
   * @param claim - La solicitud.
   * @param lines - Sus renglones.
   * @param fail - Lanza el 422 con el campo.
   * @returns El total solicitado.
   */
  private requestedCents(
    claim: InsuranceClaims,
    lines: readonly InsuranceClaimLines[],
    fail: (message: string, field: string) => never,
  ): bigint {
    if (claim.totalAmount == null) {
      return fail('La solicitud no tiene un monto solicitado', 'totalAmount');
    }
    try {
      const requested = toCents(claim.totalAmount);
      const billed = lines.reduce(
        (sum, line) =>
          sum + (line.billedAmount ? toCents(line.billedAmount) : 0n),
        0n,
      );
      if (billed !== requested) {
        return fail('Los renglones no suman el monto solicitado', 'lines');
      }
      return requested;
    } catch (error) {
      if (error instanceof RangeError) {
        return fail(
          'El monto solicitado no es un importe válido',
          'totalAmount',
        );
      }
      throw error;
    }
  }

  /**
   * El monto de una aprobación parcial: mayor que cero y menor que lo solicitado.
   *
   * @param approvedAmount - Lo que mandó el cliente.
   * @param requestedCents - Lo solicitado.
   * @param fail - Lanza el 422 con el campo.
   * @returns El monto aprobado en centavos.
   */
  private partialCents(
    approvedAmount: string | undefined,
    requestedCents: bigint,
    fail: (message: string, field: string) => never,
  ): bigint {
    const message =
      'El monto aprobado debe ser mayor que cero y menor que el monto solicitado';
    if (approvedAmount === undefined) return fail(message, 'approvedAmount');
    try {
      const cents = toCents(approvedAmount);
      if (cents <= 0n || cents >= requestedCents) {
        return fail(message, 'approvedAmount');
      }
      return cents;
    } catch (error) {
      if (error instanceof RangeError) return fail(message, 'approvedAmount');
      throw error;
    }
  }

  /**
   * Escribe la versión de adjudicación, una adjudicación por renglón y el
   * nuevo estado de la solicitud.
   *
   * @param tx - Transacción activa, con la solicitud bloqueada.
   * @param claim - La solicitud.
   * @param plan - El dictamen ya validado.
   * @param dto - Lo que pidió el cliente (la cláusula opcional).
   * @param actor - Quien dictamina.
   */
  private async writeDecision(
    tx: EntityManager,
    claim: InsuranceClaims,
    plan: DecisionPlan,
    dto: ReceivedClaimDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const version = this.claimRepo.createVersion(tx, {
      insuranceClaimId: claim.id,
      adjudicationVersion: 1,
      outcomeConceptId: CONCEPT_BY_OUTCOME[plan.outcome],
      dispositionText: plan.reason === '' ? undefined : plan.reason,
      totalApprovedAmount: fromCents(plan.approvedCents),
      totalPatientAmount: '0.00',
      totalDeniedAmount: fromCents(plan.requestedCents - plan.approvedCents),
      actorUserId: actor.id,
    });
    await tx.flush();

    const clause = dto.policyClauseReference?.trim() || undefined;
    for (const line of plan.lines) {
      const denied = toCents(line.deniedAmount) > 0n;
      this.claimRepo.createLineAdjudication(tx, {
        claimAdjudicationVersionId: version.id,
        insuranceClaimLineId: line.id,
        decisionConceptId:
          toCents(line.approvedAmount) > 0n
            ? INS.LINE_DECISION_APPROVED
            : INS.LINE_DECISION_DENIED,
        approvedAmount: line.approvedAmount,
        patientAmount: '0.00',
        deniedAmount: line.deniedAmount,
        // Sólo lo que no se aprueba se fundamenta: ni la cláusula ni el motivo
        // viajan en una línea aprobada entera.
        policyClauseReference: denied ? clause : undefined,
        denialRationale: denied && plan.reason !== '' ? plan.reason : undefined,
      });
    }

    claim.statusConceptId = INS.CLAIM_ADJUDICATED;
    touch(claim, actor.id);
    await tx.flush();
  }

  /**
   * Publica el evento de facturación de un dictamen favorable.
   *
   * En la misma transacción: se confirma —o se pierde— exactamente con el
   * dictamen que lo produjo. Un rechazo no factura nada. El payload lleva ids
   * e importes, nunca datos del paciente.
   *
   * @param tx - Transacción activa.
   * @param claim - La solicitud ya dictaminada.
   * @param plan - El dictamen.
   * @param carrierId - La aseguradora que dictaminó.
   * @param tenantId - Su tenant.
   * @param actor - Quien dictaminó.
   */
  private async publishDecision(
    tx: EntityManager,
    claim: InsuranceClaims,
    plan: DecisionPlan,
    carrierId: string,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (plan.outcome === 'REJECTED') return;
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: CLAIM_DECIDED_EVENT,
      aggregateType: CLAIM_AGGREGATE,
      aggregateId: claim.id,
      payloadJson: {
        claimId: claim.id,
        insuranceCarrierId: carrierId,
        billingProviderTypeConceptId: claim.billingProviderTypeConceptId,
        billingProviderEntityId: claim.billingProviderEntityId,
        outcome: plan.outcome,
        approvedAmount: fromCents(plan.approvedCents),
        requestedAmount: fromCents(plan.requestedCents),
        currencyConceptId: claim.currencyConceptId ?? null,
        decidedByUserId: actor.id,
      },
    });
  }

  /**
   * Arma las filas para la pantalla resolviendo todo por lote.
   *
   * @param em - Contexto de persistencia.
   * @param claims - Las solicitudes, ya acotadas a la aseguradora.
   * @returns Las filas, en el orden recibido.
   */
  private async buildItems(
    em: EntityManager,
    claims: readonly InsuranceClaims[],
  ): Promise<ReceivedClaimDto[]> {
    if (claims.length === 0) return [];
    const context = await this.loadContext(em, claims);
    return claims.map((claim) => this.toItem(claim, context));
  }

  /** Proyección de filas que el llamador ya acotó por titular o prestador (P56). */
  async buildMyItems(
    em: EntityManager,
    claims: readonly InsuranceClaims[],
    view: MyClaimsView,
  ): Promise<MyClaimDto[]> {
    if (claims.length === 0) return [];
    const [items, carriers] = await Promise.all([
      this.buildItems(em, claims),
      this.claimReadRepo.findCarriersByIds(
        em,
        unique(claims.map((claim) => claim.insuranceCarrierId)),
      ),
    ]);
    const carrierNames = new Map(
      carriers.map((carrier) => [carrier.id, carrier.legalName]),
    );
    const carrierByClaim = new Map(
      claims.map((claim) => [claim.id, claim.insuranceCarrierId]),
    );
    return items.map((item) => ({
      id: item.id,
      claimIdentifier: item.claimIdentifier,
      patientName: view === 'PATIENT' ? null : item.patient.displayName,
      practitioner: item.practitioner
        ? {
            displayName: item.practitioner.displayName,
            specialty: item.practitioner.specialty,
          }
        : null,
      providerName: item.providerName,
      service: item.service,
      additionalServiceCount: item.additionalServiceCount,
      billedTotal: item.billedTotal,
      approvedTotal: item.approvedTotal,
      submittedAt: item.submittedAt,
      serviceDate: item.serviceDate,
      insurerName: carrierNames.get(carrierByClaim.get(item.id) ?? '') ?? '',
      planName: item.planName,
      status: item.status,
      decision: item.decision
        ? {
            outcome: item.decision.outcome,
            decidedAt: item.decision.decidedAt,
            reason: item.decision.reason,
          }
        : null,
    }));
  }

  /**
   * Lee, por lote, todo lo que las filas necesitan.
   *
   * @param em - Contexto de persistencia.
   * @param claims - Las solicitudes.
   * @returns Los mapas por id.
   */
  private async loadContext(
    em: EntityManager,
    claims: readonly InsuranceClaims[],
  ): Promise<RowContext> {
    const claimIds = claims.map((claim) => claim.id);
    const [lines, versions, coverages, encounters] = await Promise.all([
      this.claimReadRepo.findLinesByClaimIds(em, claimIds),
      this.claimReadRepo.findAdjudicationsByClaimIds(em, claimIds),
      this.claimReadRepo.findCoveragesByIds(
        em,
        unique(claims.map((claim) => claim.patientCoverageId)),
      ),
      this.claimReadRepo.findEncountersByIds(
        em,
        unique(claims.map((claim) => claim.encounterId)),
      ),
    ]);

    const patientIds = unique(coverages.map((c) => c.patientProfileId));
    const practitionerIds = unique(
      encounters.map((e) => e.primaryPractitionerId),
    );
    const typeOf = (id: string) =>
      claims.filter((claim) => claim.billingProviderTypeConceptId === id);
    const [persons, profiles, plans, specialties, practices, units, users] =
      await Promise.all([
        em.find(Persons, {
          id: { $in: unique([...patientIds, ...practitionerIds]) },
        }),
        patientIds.length === 0
          ? Promise.resolve([])
          : em.find(PatientProfiles, { profileId: { $in: patientIds } }),
        this.claimReadRepo.findPlansByIds(
          em,
          unique(coverages.map((c) => c.insurancePlanId)),
        ),
        this.claimReadRepo.findSpecialtiesByPractitionerIds(
          em,
          practitionerIds,
        ),
        this.claimReadRepo.findPracticesByIds(
          em,
          unique(
            typeOf(INS.BILLING_PROVIDER_TYPE_PRACTICE).map(
              (claim) => claim.billingProviderEntityId,
            ),
          ),
        ),
        this.claimReadRepo.findDiagnosticUnitsByIds(
          em,
          unique(
            typeOf(INS.BILLING_PROVIDER_TYPE_DIAGNOSTIC_UNIT).map(
              (claim) => claim.billingProviderEntityId,
            ),
          ),
        ),
        this.claimReadRepo.findUsersByIds(
          em,
          unique(versions.map((version) => version.adjudicatedByUserId)),
        ),
      ]);

    const concepts = await this.conceptMap(em, [
      ...claims.flatMap((claim) => [
        claim.statusConceptId,
        claim.currencyConceptId,
      ]),
      ...lines.map((line) => line.serviceConceptId),
      ...specialties.map((specialty) => specialty.specialtyConceptId),
    ]);

    const personById = new Map(persons.map((person) => [person.id, person]));
    const profileById = new Map(
      profiles.map((profile) => [profile.profileId, profile]),
    );

    const patients = new Map<string, ClaimPatientDto>();
    const coverageOf = new Map<
      string,
      { policy: string | null; planId: string }
    >();
    for (const coverage of coverages) {
      patients.set(coverage.id, {
        id: coverage.patientProfileId,
        displayName:
          personById.get(coverage.patientProfileId)?.displayName ?? null,
        patientCode:
          profileById.get(coverage.patientProfileId)?.patientCode ?? null,
        memberIdentifier: coverage.memberIdentifier ?? null,
      });
      coverageOf.set(coverage.id, {
        policy: coverage.policyIdentifier ?? null,
        planId: coverage.insurancePlanId,
      });
    }

    const practitioners = new Map<string, ReceivedClaimPractitionerDto>();
    for (const practitionerId of practitionerIds) {
      const own = specialties.filter(
        (s) => s.practitionerProfileId === practitionerId,
      );
      const main = own.find((s) => s.isPrimary === true) ?? own[0];
      practitioners.set(practitionerId, {
        id: practitionerId,
        displayName: personById.get(practitionerId)?.displayName ?? '',
        specialty: main
          ? (concepts.get(main.specialtyConceptId)?.display ?? null)
          : null,
      });
    }

    const providerNames = new Map<string, string>();
    for (const practice of practices)
      providerNames.set(practice.id, practice.name);
    for (const unit of units) providerNames.set(unit.id, unit.name);

    return {
      lines: groupLines(lines),
      currentVersion: currentVersionByClaim(versions),
      concepts,
      patients,
      coverageOf,
      planNames: new Map(plans.map((plan) => [plan.id, plan.name])),
      practitioners,
      encounterOf: new Map(
        encounters.map((encounter) => [
          encounter.id,
          {
            practitionerId: encounter.primaryPractitionerId ?? null,
            startAt: encounter.startAt ?? null,
          },
        ]),
      ),
      providerNames,
      userNames: new Map(users.map((user) => [user.id, user.displayName])),
    };
  }

  /**
   * Una fila de la pantalla.
   *
   * @param claim - La solicitud.
   * @param ctx - Lo leído por lote.
   * @returns La fila.
   */
  private toItem(claim: InsuranceClaims, ctx: RowContext): ReceivedClaimDto {
    const currency = ctx.concepts.get(claim.currencyConceptId ?? '') ?? null;
    const lines = (ctx.lines.get(claim.id) ?? []).map((line) =>
      toLine(line, ctx.concepts, currency),
    );
    const version = ctx.currentVersion.get(claim.id);
    const encounter = claim.encounterId
      ? ctx.encounterOf.get(claim.encounterId)
      : undefined;
    const coverage = ctx.coverageOf.get(claim.patientCoverageId);
    const first = lines[0];

    return {
      id: claim.id,
      claimIdentifier: claim.claimIdentifier,
      patient: ctx.patients.get(claim.patientCoverageId) ?? {
        id: '',
        displayName: null,
        patientCode: null,
        memberIdentifier: null,
      },
      practitioner: encounter?.practitionerId
        ? (ctx.practitioners.get(encounter.practitionerId) ?? null)
        : null,
      providerName: ctx.providerNames.get(claim.billingProviderEntityId) ?? '',
      service:
        first && first.code !== ''
          ? { code: first.code, display: first.display }
          : null,
      additionalServiceCount: Math.max(lines.length - 1, 0),
      billedTotal: { amount: claim.totalAmount ?? '0', currency },
      approvedTotal: version
        ? money(version.totalApprovedAmount, currency)
        : null,
      submittedAt: claim.submittedAt?.toISOString() ?? null,
      serviceDate: encounter?.startAt ? laPazDate(encounter.startAt) : null,
      policyIdentifier: coverage?.policy ?? null,
      planName: coverage ? (ctx.planNames.get(coverage.planId) ?? null) : null,
      status: this.statusOf(claim, version, ctx.concepts),
      lines,
      decision: version ? this.toDecision(version, ctx) : null,
      invoice: null,
    };
  }

  /**
   * El estado que ve la pantalla.
   *
   * Es derivado: `CLAIM_ADJUDICATED` no distingue entre aprobada, parcial y
   * rechazada; eso lo dice el resultado de la versión vigente.
   *
   * @param claim - La solicitud.
   * @param version - Su versión vigente, si la tiene.
   * @param concepts - Conceptos ya leídos.
   * @returns El estado, o el concepto tal cual si no hay equivalencia.
   */
  private statusOf(
    claim: InsuranceClaims,
    version: ClaimAdjudicationVersions | undefined,
    concepts: Map<string, InsuranceConceptDto>,
  ): InsuranceConceptDto | null {
    const fixed = STATUS_BY_CLAIM_CONCEPT.get(claim.statusConceptId);
    if (fixed) return fixed;
    const outcome = version
      ? OUTCOME_BY_CONCEPT.get(version.outcomeConceptId)
      : undefined;
    if (claim.statusConceptId === INS.CLAIM_ADJUDICATED && outcome) {
      return STATUS_BY_OUTCOME[outcome];
    }
    return concepts.get(claim.statusConceptId) ?? null;
  }

  /**
   * El dictamen vigente tal como lo ve la pantalla.
   *
   * @param version - La versión vigente.
   * @param ctx - Lo leído por lote.
   * @returns El dictamen.
   */
  private toDecision(
    version: ClaimAdjudicationVersions,
    ctx: RowContext,
  ): ReceivedClaimDecisionViewDto | null {
    const outcome = OUTCOME_BY_CONCEPT.get(version.outcomeConceptId);
    if (!outcome) return null;
    return {
      outcome,
      decidedAt: version.adjudicatedAt.toISOString(),
      decidedBy:
        ctx.userNames.get(version.adjudicatedByUserId ?? '') ?? 'Aseguradora',
      reason: version.dispositionText ?? null,
    };
  }

  /**
   * Resuelve ids de concepto a su par legible.
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
 * Un importe con su moneda, o `null` si no hay importe.
 *
 * `null` y `'0.00'` no son lo mismo: uno es «todavía no hay dictamen» y el otro
 * «el dictamen aprobó cero».
 *
 * @param amount - Importe crudo de la base, o nulo.
 * @param currency - Moneda de la solicitud.
 * @returns El importe con su moneda, o `null`.
 */
function money(
  amount: string | null | undefined,
  currency: InsuranceConceptDto | null,
): MoneyDto | null {
  if (amount == null || amount === '') return null;
  return { amount, currency };
}

/**
 * El día de una atención en `America/La_Paz`, que es el de la sede.
 *
 * Un instante en UTC puede caer en el día siguiente al de la atención: una
 * consulta de las 23:30 en La Paz ya es «mañana» en UTC.
 *
 * @param instant - El comienzo de la atención.
 * @returns `YYYY-MM-DD`.
 */
function laPazDate(instant: Date): string {
  return new Date(instant.getTime() + LA_PAZ_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Agrupa los renglones por solicitud, de mayor a menor importe.
 *
 * Es el orden que la pantalla promete: el servicio principal, el de mayor
 * importe, es el primero; a igual importe, el de menor secuencia.
 *
 * @param lines - Los renglones de todas las solicitudes.
 * @returns Los renglones ordenados, por id de solicitud.
 */
function groupLines(
  lines: readonly InsuranceClaimLines[],
): Map<string, InsuranceClaimLines[]> {
  const grouped = new Map<string, InsuranceClaimLines[]>();
  for (const line of lines) {
    const own = grouped.get(line.insuranceClaimId) ?? [];
    own.push(line);
    grouped.set(line.insuranceClaimId, own);
  }
  const amount = (line: InsuranceClaimLines): bigint => {
    try {
      return line.billedAmount ? toCents(line.billedAmount) : 0n;
    } catch {
      return 0n;
    }
  };
  for (const own of grouped.values()) {
    own.sort((a, b) => {
      const byAmount = amount(b) - amount(a);
      if (byAmount !== 0n) return byAmount > 0n ? 1 : -1;
      return a.lineSequence - b.lineSequence;
    });
  }
  return grouped;
}

/**
 * La versión vigente de cada solicitud: la que nadie sucede.
 *
 * @param versions - Todas las versiones de las solicitudes.
 * @returns La vigente por id de solicitud.
 */
function currentVersionByClaim(
  versions: readonly ClaimAdjudicationVersions[],
): Map<string, ClaimAdjudicationVersions> {
  const superseded = new Set(
    versions
      .map((version) => version.supersedesVersionId)
      .filter((id): id is string => id != null),
  );
  const current = new Map<string, ClaimAdjudicationVersions>();
  for (const version of versions) {
    if (superseded.has(version.id)) continue;
    if (!current.has(version.insuranceClaimId)) {
      current.set(version.insuranceClaimId, version);
    }
  }
  return current;
}

/**
 * Un renglón de la solicitud para la pantalla.
 *
 * El precio unitario es **derivado** —lo facturado dividido la cantidad, en
 * centavos—: la línea no guarda el precio de lista.
 *
 * @param line - El renglón.
 * @param concepts - Conceptos ya leídos.
 * @param currency - Moneda de la solicitud.
 * @returns El renglón.
 */
function toLine(
  line: InsuranceClaimLines,
  concepts: Map<string, InsuranceConceptDto>,
  currency: InsuranceConceptDto | null,
): ReceivedClaimLineDto {
  const service = concepts.get(line.serviceConceptId ?? '');
  const billed = line.billedAmount ?? '0.00';
  const quantity = line.quantity == null ? 1 : Number(line.quantity);
  return {
    sequence: line.lineSequence,
    code: service?.code ?? '',
    display: service?.display ?? `Ítem ${line.lineSequence}`,
    quantity,
    unitPrice: {
      amount: unitPrice(billed, quantity),
      currency,
    },
    billedAmount: { amount: billed, currency },
  };
}

/**
 * El precio unitario: lo facturado dividido la cantidad, redondeado al centavo.
 *
 * @param billed - Importe facturado del renglón.
 * @param quantity - Cantidad.
 * @returns El precio unitario, o el facturado si la cantidad no es positiva.
 */
function unitPrice(billed: string, quantity: number): string {
  try {
    const cents = toCents(billed);
    if (!(quantity > 0)) return fromCents(cents);
    return fromCents(BigInt(Math.round(Number(cents) / quantity)));
  } catch {
    return billed;
  }
}
